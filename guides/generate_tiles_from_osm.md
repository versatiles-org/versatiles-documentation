# How to generate tiles from OSM?

> [!NOTE]
> If you don't need custom tiles, you can [download pre-built planet tiles](download_tiles.md) from the official VersaTiles distribution instead - it's much faster.

This guide explains how to generate [Shortbread](https://shortbread-tiles.org) vector tiles from OpenStreetMap data using the [`versatiles-planetiler`](https://github.com/versatiles-org/versatiles-docker/tree/main/versatiles-planetiler) Docker image. The image bundles [Planetiler](https://github.com/onthegomap/planetiler), the Shortbread profile, and [VersaTiles](https://github.com/versatiles-org/versatiles-rs) for packaging the result.

> [!NOTE]
> Our Planetiler-based Shortbread profile is still **beta**. It generates the published tilesets, but output details may still change between builds.

## Requirements

- [Docker](https://docs.docker.com/engine/install/)
- Sufficient disk space - planet requires ~400 GB free
- Sufficient RAM - in the default disk mode, half the size of the source `.osm.pbf` plus 3 GB (planet: ~48 GB). The image checks this before it starts and stops if the container has less.

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
> Run the image with `-it` and **no arguments** to get an interactive wizard instead. It asks for the area, container format, output name, checksums and processing mode, then runs the same pipeline.

**Common `--area` values:**

| Region  | `--area` value |
| ------- | -------------- |
| Planet  | `planet`       |
| Europe  | `europe`       |
| Germany | `germany`      |
| Berlin  | `berlin`       |

Any [Geofabrik](https://download.geofabrik.de) region works as an area value. Use the region's own name (e.g. `berlin`, `monaco`, `massachusetts`), **not** a path like `germany/berlin`. If a name is ambiguous, add a qualifier, e.g. `us georgia` for the US state.

## Step 3: Find the output

Once complete, the result is in `result/result/`:

```
result/
└── result/
    ├── osm-vector.2026-06-22.versatiles
    ├── osm-vector.2026-06-22.versatiles.md5
    └── osm-vector.2026-06-22.versatiles.sha256
```

The filename is auto-generated as `osm-vector.<date>` for the planet, and `osm-vector.<region>.<date>` for a sub-region — so a Berlin build becomes `osm-vector.berlin.2026-06-22.versatiles`.

## Optional flags

Every option has an environment-variable equivalent, so the image can also be driven from a `docker-compose.yml`. Flags take precedence over the environment.

| Flag                    | Environment     | Default       | Description                                                                                                                        |
| ----------------------- | --------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--format <fmt>`        | `FORMAT`        | `versatiles`  | `versatiles` (brotli), `pmtiles` or `mbtiles`                                                                                      |
| `--name <basename>`     | `OUTPUT_NAME`   | see above     | Output filename, without the extension                                                                                             |
| `--mode <disk\|memory>` | `MODE`          | `disk`        | Where Planetiler keeps its temporary data: memory-mapped files, or the Java heap (faster, but needs about three times as much RAM) |
| `--xmx <size>`          | `XMX`           | from `--mode` | Override the JVM heap that `--mode` derives, e.g. `20g`                                                                            |
| `--torrent`             | `TORRENT=1`     | off           | For `--area planet`: fetch the `.osm.pbf` via BitTorrent instead of HTTP                                                           |
| `--renumber`            | `RENUMBER=1`    | off           | Renumber the OSM IDs with `osmium` first: a bit faster and 2–4 % smaller tiles, but the feature IDs are no longer OSM IDs          |
| `--checksum`            | `CHECKSUM=1`    | off           | Write `<output>.md5` and `<output>.sha256`                                                                                         |
| `-i`, `--interactive`   | `INTERACTIVE=1` | –             | Force the interactive wizard                                                                                                       |

The [image README](https://github.com/versatiles-org/versatiles-docker/tree/main/versatiles-planetiler#-memory) explains how much memory each mode needs.

> [!NOTE]
> This image only writes OSM tiles. Land cover is a separate tileset, [`landcover-vector`](../basics/tilesets.md#landcover), that a style draws under OSM: see [Using it with OSM](https://github.com/versatiles-org/landcover-vectors#using-it-with-osm). The `--landcover` option and `LANDCOVER=1` have been removed and now stop with an error.

The same build as a Compose service:

```yaml
services:
  planetiler:
    image: versatiles/versatiles-planetiler:latest
    environment:
      AREA: planet
      FORMAT: versatiles
      MODE: disk
    volumes:
      - ./result:/app/data
```

### Schema extensions and languages

The image enables **all** [Shortbread schema extensions](../compendium/specification_shortbread_extensions.md) by default (`EXPERIMENTS=all`) — 3D buildings, localized names, island labels, address details, bridge names, early street attributes and mountain peaks. Set `EXPERIMENTS=none` to switch them all off, or a comma-separated list to pick individual ones.

Localized names default to `LANGUAGES=extended`, the [81 languages](https://github.com/versatiles-org/planetiler-shortbread#names) of the Shortbread profile. Set a comma-separated list of codes (e.g. `en,de,fr`) to limit them, or combine both (`extended,tok`).

## Next steps

Once you have a `.versatiles` file, you can [run a local server](local_server_debian.md) or [deploy it](deploy_using_docker.md) to serve tiles.
