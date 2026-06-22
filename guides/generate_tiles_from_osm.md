# How to generate tiles from OSM?

> [!NOTE]
> If you don't need custom tiles, you can [download pre-built planet tiles](download_tiles.md) from the official VersaTiles distribution instead - it's much faster.

This guide explains how to generate [Shortbread](https://shortbread-tiles.org) vector tiles from OpenStreetMap data using the [`versatiles-planetiler`](https://github.com/versatiles-org/versatiles-docker/tree/main/versatiles-planetiler) Docker image. The image bundles [Planetiler](https://github.com/onthegomap/planetiler), the Shortbread profile, and [VersaTiles](https://github.com/versatiles-org/versatiles-rs) for packaging the result.

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
    ├── osm.planet.2026-06-22.versatiles
    ├── osm.planet.2026-06-22.versatiles.md5
    └── osm.planet.2026-06-22.versatiles.sha256
```

The filename is auto-generated as `osm[.<area>].<date>.versatiles`.

## Optional flags

**Add land cover data** - merges natural land cover into the tile layers:

```bash
  --landcover
```

**Choose output format** (default: `versatiles`):

```bash
  --format pmtiles   # or: versatiles, mbtiles
```

**Set a custom output name:**

```bash
  --name "my-tiles"
```

**Limit JVM heap size** (useful when RAM is constrained):

```bash
  --xmx 20g
```

## Next steps

Once you have a `.versatiles` file, you can [run a local server](local_server_debian.md) or [deploy it](deploy_using_docker.md) to serve tiles.
