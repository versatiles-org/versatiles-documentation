# How to generate tiles from OSM?

> [!NOTE]
> If you don't need custom tiles, you can [download pre-built planet tiles](download_tiles.md) from the official VersaTiles distribution instead - it's much faster.

This guide explains how to generate [Shortbread](https://shortbread-tiles.org) vector tiles from OpenStreetMap data using the [`versatiles-planetiler`](https://github.com/versatiles-org/versatiles-docker/tree/main/versatiles-planetiler) Docker image. The image bundles [Planetiler](https://github.com/onthegomap/planetiler), the Shortbread profile, and [VersaTiles](https://github.com/versatiles-org/versatiles-rs) for packaging the result.

> [!NOTE]
> Our Planetiler-based Shortbread profile is still **beta**. It generates the published tilesets, but output details may still change between builds.

## Requirements

- [Docker](https://docs.docker.com/engine/install/)
- Sufficient disk space - planet requires ~400 GB free
- Sufficient RAM - at least half the size of the source `.osm.pbf` (planet: ~64 GB)

## Step 1: Create a working directory

```bash
mkdir -p result
```

The container stores downloaded sources, temporary files, and the final output inside this directory.

## Step 2: Run the Docker image

```bash
docker run -it --rm \
  --mount="type=bind,source=$(pwd)/result,target=/app/data" \
  versatiles/versatiles-planetiler \
  --area "planet" \
  --checksum
```

The `--checksum` flag writes `.md5` and `.sha256` sidecar files next to the output.

> [!TIP]
> Run the image with `-it` and **no arguments** to get an interactive wizard instead. It asks for the area, land cover, container format and output name, then runs the same pipeline.

**Common `--area` values:**

| Region  | `--area` value |
| ------- | -------------- |
| Planet  | `planet`       |
| Europe  | `europe`       |
| Germany | `germany`      |
| Berlin  | `berlin`       |

Any [Geofabrik](https://download.geofabrik.de) region path works as an area value.

## Step 3: Find the output

Once complete, the result is in `result/result/`:

```
result/
└── result/
    ├── osm.2026-06-22.versatiles
    ├── osm.2026-06-22.versatiles.md5
    └── osm.2026-06-22.versatiles.sha256
```

The filename is auto-generated as `osm[-landcover].<date>` for the planet, and `osm[-landcover].<region>.<date>` for a sub-region — so a Berlin build with land cover becomes `osm-landcover.berlin.2026-06-22.versatiles`.

## Optional flags

Every option has an environment-variable equivalent, so the image can also be driven from a `docker-compose.yml`. Flags take precedence over the environment.

| Flag                  | Environment     | Default               | Description                                                                     |
| --------------------- | --------------- | --------------------- | ------------------------------------------------------------------------------- |
| `--landcover`         | `LANDCOVER=1`   | off                   | Merge low-zoom land cover into the Shortbread layers                            |
| `--format <fmt>`      | `FORMAT`        | `versatiles`          | `versatiles` (brotli), `pmtiles` or `mbtiles`                                   |
| `--name <basename>`   | `OUTPUT_NAME`   | see above             | Output filename, without the extension                                          |
| `--xmx <size>`        | `XMX`           | from container memory | JVM heap for Planetiler, e.g. `20g`                                             |
| `--torrent`           | `TORRENT=1`     | off                   | For `--area planet`: fetch the `.osm.pbf` via BitTorrent instead of HTTP        |
| `--no-renumber`       | `RENUMBER=0`    | renumber is on        | Skip `osmium renumber` (dense IDs build faster and give slightly smaller tiles) |
| `--checksum`          | `CHECKSUM=1`    | off                   | Write `<output>.md5` and `<output>.sha256`                                      |
| `-i`, `--interactive` | `INTERACTIVE=1` | –                     | Force the interactive wizard                                                    |

The same build as a Compose service:

```yaml
services:
  planetiler:
    image: versatiles/versatiles-planetiler:latest
    environment:
      AREA: planet
      LANDCOVER: '1'
      FORMAT: versatiles
      XMX: 20g
    volumes:
      - ./result:/app/data
```

### Schema extensions and languages

The image enables **all** [Shortbread schema extensions](../compendium/specification_shortbread_extensions.md) by default (`EXPERIMENTS=all`) — 3D building heights, building parts, localized names, island labels, address details and bridge names. Set `EXPERIMENTS=none` for strictly spec-conformant output, or a comma-separated list to pick individual ones.

Localized names default to `LANGUAGES=en,fr,es,de,ar,el,it,nl,pl,pt,uk`.

## Next steps

Once you have a `.versatiles` file, you can [run a local server](local_server_debian.md) or [deploy it](deploy_using_docker.md) to serve tiles.
