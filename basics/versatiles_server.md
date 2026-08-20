# How does the VersaTiles server work?

The VersaTiles server is built in Rust and provides excellent performance with low resource usage. In this article, we'll look at the main components and functionality of the VersaTiles server.

## File Format

One of the core concepts of VersaTiles is the unique [.versatiles file format](https://github.com/versatiles-org/versatiles-spec) for storing map data. This format not only contains all the map tiles for the entire planet, but also has an index of all the map tiles with their respective byte offset and length within the file.

The `.versatiles` format does not need to be stored locally. It can be accessed remotely over HTTP using byte range requests, which allow the server to fetch only the specific bytes that contain a requested tile. This means the server can serve tiles directly from a remote file without downloading it first, which makes it straightforward to build scalable map infrastructures backed by cloud storage.

The idea to develop a container that can be accessed via HTTP byte range request is based on [COMTiles](https://github.com/mactrem/com-tiles) and [PMTiles](https://github.com/protomaps/PMTiles). However, since we have a slightly different focus and saw the need to deviate from the previous implementations if necessary, we decided to develop our own standard. However, we are very open to supporting COMTiles and PMTiles as alternatives in our pipeline.

## Installation and setup

First you need to install VersaTiles. See the instructions in the documentation: [Installing VersaTiles](../guides/install_versatiles.md).

You will also need our prepared map tiles. You can find more information on this in the instructions: [Downloading map tiles](../guides/download_tiles.md).

## Usage

You can then start the server by using `versatiles` with the subcommand `serve` and then simply adding the versatiles file as argument:

```bash
versatiles serve planet.versatiles
```

## Multiple sources

If you want to serve more than one source, you can easily add them:

```bash
versatiles serve planet.versatiles satellite_imagery.mbtiles my_overlay.tar
```

When the server is started, all sources and their URL are listed:

```
info: add tile source: /tiles/planet/* <- container 'versatiles' ('/data/planet.versatiles')
info: add tile source: /tiles/satellite_imagery/* <- container 'mbtiles' ('/data/satellite_imagery.mbtiles')
info: add tile source: /tiles/my_overlay/* <- container 'tar' ('/data/my_overlay.tar')
```

Each source gets an URL based on the file name (without extension). If you want to use a different URL, you can use this special notation with square brackets:

```bash
versatiles serve "[osm]planet.versatiles" "[satellite]satellite_imagery.mbtiles" "[heatmap]my_overlay.tar"
```

Now the URLs look like this:

```
info: add tile source: /tiles/osm/* <- container 'versatiles' ('/data/planet.versatiles')
info: add tile source: /tiles/satellite/* <- container 'mbtiles' ('/data/satellite_imagery.mbtiles')
info: add tile source: /tiles/heatmap/* <- container 'tar' ('/data/my_overlay.tar')
```

The name can also be appended instead of prefixed — `"planet.versatiles[osm]"` is equivalent to `"[osm]planet.versatiles"`. Run `versatiles help source` for the full data-source syntax.

## Optional frontend

You can extend the VersaTiles server with an optional frontend. This frontend includes the latest version of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), map styles, fonts and symbols. You can [download the frontend](../basics/frontend.md#download-the-frontend):

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz"
```

You can then add the frontend to the server by adding the tar file with a `-s` argument:

```bash
versatiles serve -s frontend.br.tar.gz planet.versatiles
```

## Different IP/Port

By default versatiles uses 0.0.0.0:8080. If you want to change IP/Port use the options:

- `-i`/`--ip`: e.g. `-i 127.0.0.1`
- `-p`/`--port`: e.g. `-p 3000`

## Configuration file

For more complex setups — several tile sources, CORS rules, static content, custom response headers — the server can be configured with a YAML file instead of a long command line:

```bash
versatiles serve --config config.yaml
```

A small but complete example:

```yaml
server:
  ip: 0.0.0.0 # default: 0.0.0.0
  port: 8080 # default: 8080

tiles:
  - name: osm # served at /tiles/osm/...
    src: osm.versatiles
  - name: satellite
    src: https://example.org/satellite.versatiles # remote container

static:
  - src: ./frontend.br.tar.gz # tar archive or directory
    prefix: / # default: /

cors:
  allowed_origins: ['*.example.org'] # default: ["*"]

extra_response_headers:
  Cache-Control: public, max-age=86400, immutable
```

Every section and field is optional; omitted fields fall back to their defaults. A tile source can also point to a `.vpl` pipeline file — see `versatiles help pipeline`.

Command line arguments override values from the configuration file. For the full annotated schema, run `versatiles help config` or read [`CONFIG.md`](https://github.com/versatiles-org/versatiles-rs/blob/main/versatiles/CONFIG.md) in the versatiles-rs repository.

## What's not included?

The VersaTiles server implements only core functionality to keep the project simple and easy to maintain. TLS certificates and caching are not included. You can use a CDN or a reverse proxy such as nginx — see the [deployment guides](../guides/deploy_using_docker.md) for how to set this up.

## Scalability and performance

Rust, the programming language used to develop the VersaTiles server, is known for its performance and low resource consumption. As a result, the VersaTiles server can handle a large number of concurrent requests while maintaining fast response times. This makes it ideal for applications ranging from small projects to large, data-intensive infrastructures.
