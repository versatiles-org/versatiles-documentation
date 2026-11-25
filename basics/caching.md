# Caching

The `Cache-Control` header of a response tells browsers, proxies and CDNs how long they may keep a file before they ask the server again. This page explains the defaults of the VersaTiles server (`versatiles serve`), how to change them, and what to keep in mind behind a proxy or CDN. [Other servers](#other-servers) at the end covers the Node.js servers and serving the frontend from another web server.

## The model

A URL either always stands for the same content, or it doesn't.

- **Fixed URLs** such as `/`, `index.html`, `style.json` or `tiles.json` keep their URL when their content changes. A client must check them every time it uses them. That is what `no-cache` means: the client may keep the file, but asks the server first whether it is still current. Every file comes with an `ETag`, so the client sends `If-None-Match`, and if nothing has changed, the server answers `304 Not Modified` with an empty body. Such a check costs almost nothing.
- **Versioned URLs** contain a version, such as `/assets/lib/maplibre-gl@6.19.0/maplibre-gl.js`. Under that URL the content never changes, because a new version gets a new URL. A client may keep such a file for a year without asking again.

Tiles fall between the two: their URLs are fixed, but a tileset changes rarely, so the server lets clients keep them for a while.

## The defaults of `versatiles serve`

| Response                                     | `Cache-Control`                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| Tiles, empty tiles (`204`) and `tiles.json`  | `public, max-age=2419200, no-transform` (four weeks)                   |
| `/tiles/index.json`                          | `public, max-age=2419200, no-transform` (four weeks, not configurable) |
| Static files, such as the frontend           | `no-cache`                                                             |
| Static files matching an `immutable` pattern | `public, max-age=31536000, immutable` (one year)                       |
| Errors, such as `404` or `500`               | none                                                                   |

Static files get `no-cache` since versatiles 5.14. Older versions sent them with the four weeks of the tiles, so after an update browsers could keep an outdated `index.html` for weeks. `immutable` is available since versatiles 5.15.

## How to change them

All settings go into the [configuration file](versatiles_server.md#configuration-file):

```yaml
server:
  # Tiles and tiles.json. Also available as `--cache-control` on the command line.
  cache_control: public, max-age=86400, no-transform

static:
  - src: ./frontend.br.tar.gz
    # All files of this source. Defaults to "no-cache".
    cache_control: no-cache
    # Files whose path contains a version: one year.
    immutable: ['assets/lib/*@*/**']
```

- **`server.cache_control`** sets the header of tiles and `tiles.json`. Four weeks suits a public server whose tilesets change seldom. If you serve tiles that change often, for example while you build them, set something shorter or `no-cache`. If you replace a tileset under the same name, browsers can keep showing the old tiles for up to four weeks, mixed with new ones. Publishing the new tileset under a new name avoids this.
- **`cache_control`** on a `static` entry sets the header of all files of that source. Leave it at `no-cache` unless the URLs of the files contain a version: a longer value keeps old files in browsers after an update.
- **`immutable`** on a `static` entry is a list of path patterns. A matching file is sent with `public, max-age=31536000, immutable` instead of `cache_control`. A pattern is matched against the path inside the source, without its `prefix`. `*` matches within one segment of the path, `**` across any number of segments.

On the command line, only `--cache-control` is available: `cache_control` and `immutable` for static files need the configuration file. A server started with just `--static frontend.br.tar.gz`, as our Docker images and the [Google Cloud guide](../guides/deploy_in_google_cloud.md) do, sends all static files with `no-cache`. That is safe, but browsers then check every library on every page load instead of keeping it.

Don't set `Cache-Control` in `extra_response_headers`: those headers are added to every response, including errors, and they replace the headers above.

The [frontend README](https://github.com/versatiles-org/versatiles-frontend#caching) explains which `immutable` pattern fits the frontend's versioned library folders.

## Let `immutable` match only versioned folders

An `immutable` pattern should only match folders whose name contains a version, such as `assets/lib/*@*/**`, never a whole folder such as `assets/lib/**`.

That way, a pattern that has gone out of date fails safely. If a new frontend renames its folders, the pattern matches nothing, and the files fall back to `no-cache`. A pattern that is too broad does the opposite: it lets browsers keep files with fixed URLs for a year. Because of `immutable`, many browsers don't ask the server again even when the user reloads the page, and nothing the server does afterwards reaches those copies.

## Behind a proxy or CDN

The VersaTiles server doesn't cache by itself. If you put nginx or a CDN in front of it:

- **Pass the server's `Cache-Control` through to browsers.** It is the only place that knows which files are versioned. A proxy that sets one header for all static files either keeps outdated pages in browsers or makes them download versioned libraries again and again.
- **Cache longer at the proxy or CDN only if you clear its cache on every update.** Browsers keep following the server's header, so they still see an update with the next page load.
- **Set a header for errors yourself.** The server sends errors without `Cache-Control`. A short time for `404` and `no-store` for everything else is a good choice.
- **nginx follows the server's `Cache-Control` before its own `proxy_cache_valid`.** So it keeps tiles for four weeks even if `proxy_cache_valid` says five minutes, and it doesn't cache a response marked `no-cache` at all. To decide the times in nginx, use `proxy_ignore_headers Cache-Control` together with `proxy_cache_valid` and `proxy_cache_revalidate on`. The header still reaches the browser, because `proxy_ignore_headers` only changes what nginx itself does with it.

The [nginx configuration of tiles.versatiles.org](https://github.com/versatiles-org/tiles.versatiles.org/blob/main/nginx/templates/proxy.conf.template) does all of this and explains each step.

## For app builders

- **Start from `tiles.json`** instead of hard-coding tile URLs. It lists the tile URLs, the zoom levels and the attribution, so your app follows when they change.
- **Revalidate with `If-None-Match`.** When a cached file has expired, send its `ETag` back. If nothing has changed, the answer is a `304` with an empty body. The `ETag` is a weak validator and is the same for the compressed and the uncompressed form of a file.
- **Embed the unversioned paths of a server's libraries**, such as `/assets/lib/maplibre-gl/maplibre-gl.js`. The versioned folders disappear when the server updates its frontend.

## Other servers

The defaults above are those of `versatiles serve`. Other servers behave differently:

- **[`@versatiles/server`](https://github.com/versatiles-org/node-versatiles-server)** (Node.js) sends neither `Cache-Control` nor `ETag`, so browsers load every file again in full. If that matters, put a proxy in front of it that sets the headers as described above.
- **[`@versatiles/google-cloud`](https://github.com/versatiles-org/node-versatiles-google-cloud)** sends tiles with `max-age=86400` (one day) and files from the bucket with `public, max-age=3600` (one hour), unless the object in the bucket has its own `Cache-Control` metadata. So an update reaches users within about two hours: an hour at the CDN, then an hour in the browser. `--cache-control` sets another value for all files without their own metadata; versions before 2.3 sent a week. Give the frontend's versioned folders a year with `immutable` through their metadata. Its README explains [the defaults and when to change them](https://github.com/versatiles-org/node-versatiles-google-cloud#caching).
- **Another web server**, such as nginx, Apache or a static hosting service, serving the unpacked frontend: send `no-cache` with an `ETag` or `Last-Modified` for all files, and `public, max-age=31536000, immutable` for the versioned folders under `assets/lib/`, those whose name contains an `@`.
