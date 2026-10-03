# How to use tiles.versatiles.org

We run [tiles.versatiles.org](https://tiles.versatiles.org) as a demo server for VersaTiles. It is free and open to everyone, but it comes without any guarantees — see [What to expect](#what-to-expect) below before you build on it.

You can access tiles directly via the URL pattern `https://tiles.versatiles.org/tiles/<tileset>/{z}/{x}/{y}` — for example `https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}` for the OpenStreetMap vector tiles.

The [tilesets overview](../basics/tilesets.md) describes every hosted tileset. The server itself lists them at [`tiles/index.json`](https://tiles.versatiles.org/tiles/index.json), and each tileset publishes its metadata as TileJSON at `tiles/<tileset>/tiles.json`.

You can also use one of our pre-built styles, which include all necessary URLs for tiles, fonts, and icons: [github.com/versatiles-org/versatiles-style/releases/latest](https://github.com/versatiles-org/versatiles-style/releases/latest/)

Below is a minimal HTML example showing how to implement a map using MapLibre GL JS, a popular open-source library for interactive maps:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>VersaTiles - Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.js"></script>
    <link
      href="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.css"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="map" style="width: 100%; height: 80vh;"></div>
    <script>
      new maplibregl.Map({
        container: 'map', // The container ID
        style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json', // Style URL
      });
    </script>
  </body>
</html>
```

## Attribution

Our pre-built styles already contain the required attribution, and MapLibre GL JS displays it automatically.

If you use the tile URLs directly — for example [in QGIS](use_versatiles_in_qgis.md) or in a style of your own — you have to add the attribution yourself. Note that the hosted `osm` tileset includes landcover data, so it needs both the OpenStreetMap and the ESA WorldCover attribution. The [tilesets overview](../basics/tilesets.md) has a "Licence & Attribution" section for each tileset.

## What to expect

### Breaking changes

> [!WARNING]
> We regularly update all frontend libraries, including MapLibre GL JS, plugins and styles, to the latest versions to ensure optimal performance and incorporate bug fixes. This includes major version updates with breaking changes — for example renamed styles or different sprite names.
> If your project depends on the assets hosted at tiles.versatiles.org, please be aware that these assets may change. To maintain full control, we recommend bundling the necessary libraries and styles directly into your project.

The tiles can change too: some hosted tilesets are still alpha or beta, see the maturity column in the [tilesets overview](../basics/tilesets.md).

To pin a specific version, download the frontend release of your choice from the [versatiles-frontend releases page](https://github.com/versatiles-org/versatiles-frontend/releases) and serve it from your own infrastructure. See the [frontend documentation](../basics/frontend.md) and the [server guides](local_server_debian.md) for how to do this.

### High traffic

The server is open to everyone. If you expect high traffic, please put a CDN in front of it, so that most requests are answered from the CDN's cache instead of our server.

All responses carry a `Cache-Control` header of six hours, which a CDN should respect. This also means that updates to tiles, styles or libraries can take up to six hours to reach your users.

Requests are rate-limited per IP address. The limit is far above what normal map use needs; requests beyond it are answered with `429 Too Many Requests`. The current values are in the server's [nginx configuration](https://github.com/versatiles-org/tiles.versatiles.org/blob/main/nginx/nginx.conf).

If you build your own client or cache, for example in a mobile app: responses carry no `ETag` or `Last-Modified` header, so conditional requests are never answered with `304 Not Modified` — every revalidation is a full download. Keep tiles for as long as your cache allows and then refetch them. A `429` response comes without a `Retry-After` header, so back off on your own schedule.

### Logging

Requests are logged in anonymized form. We use these logs only to track down issues and to detect obvious misuse.

### Availability

We can't guarantee 100% uptime: GitHub sponsorships and donations are currently not high enough to fund 24/7 support. So far the downtime has been approximately one hour per year (about 99.99% uptime).

If you'd like to help change that, you can support VersaTiles via [GitHub Sponsors](https://github.com/sponsors/versatiles-org) or [Open Collective](https://opencollective.com/versatiles).

### Need a stable map server?

If you rely on a stable map server, we highly recommend hosting it yourself. The [server setup tool](https://versatiles.org/tools/setup_server) generates ready-to-use installation and configuration scripts for your own VersaTiles server.
