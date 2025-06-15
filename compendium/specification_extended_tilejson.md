# Extended TileJSON 3.0

> **Status** Draft | Last updated 2025-06-15

## Introduction

This extension adds **three small, fully optional keys**—`tile_content`, `tile_format`, and `tile_schema`—to the [TileJSON 3.0] spec so that a client can discover **before it downloads the first byte** whether a source contains satellite imagery, elevation data, or a particular vector-tile schema.

### Why extend TileJSON?

| Gap in the original spec                           | Consequence                             | This extension fixes it with … |
| -------------------------------------------------- | --------------------------------------- | ------------------------------ |
| No hint whether tiles are raster or vector         | Client must fetch and sniff the data    | `tile_content`                 |
| Cannot distinguish RGB imagery vs. DEM vs. overlay | Renderer may treat a DEM as a photo     | `tile_schema`                  |
| Disallows relative URLs in `tiles`                 | Forces hand-editing for local test data | Relaxed rule for `tiles`       |

---

## Relaxed rule for `tiles`

- `tiles` **MAY** contain relative URLs.
- Each URL **MUST** be resolved relative to the JSON document’s own location.

Example: the file at `https://example.org/tiles/osm/tiles.json` contains

```json
{
  "tiles": ["{z}/{x}/{y}"],
  …
}
```

so tiles are fetched from `https://example.org/tiles/osm/{z}/{x}/{y}`.

> [!WARNING]
> When resolving a template such as `{z}/{x}/{y}` with the JavaScript `URL` class, you may receive a URL-encoded result like `https://example.org/tiles/osm/%7Bz%7D/%7Bx%7D/%7By%7D`.

---

## Property `tile_content`

`tile_content` indicates whether the source is a `"raster"` or `"vector"` tile source.

| Value    | Meaning                                           |
| -------- | ------------------------------------------------- |
| `raster` | Pixel tiles (imagery, DEM, classified rasters, …) |
| `vector` | Geometry/feature tiles (MVT, MLT)                 |

---

## Property `tile_format`

Any valid media type is allowed. Non-standard types **SHOULD** use the `vnd.*` or `x.*` tree.

### Common raster formats

| Media type   | Meaning     |
| ------------ | ----------- |
| `image/png`  | PNG images  |
| `image/jpeg` | JPEG images |
| `image/webp` | WebP images |
| `image/avif` | AVIF images |

### Common vector formats

| Media type                           | Notes                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `application/vnd.mapbox-vector-tile` | Tiles follow the [Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec/tree/master/2.1). |

> [!NOTE]
> MapLibre is developing the [MapLibre Tile specification](https://github.com/maplibre/maplibre-tile-spec) and may register its own MIME type in the future.

---

## Property `tile_schema`

`tile_schema` explains how to interpret the data. It always follows the pattern
**`<family>[ /<subtype> ][@<version>]`**

### Raster values

| Schema value     | Use-case                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `rgb`            | 3-band imagery (no alpha)                                                                                                        |
| `rgba`           | 4-band imagery with alpha                                                                                                        |
| `dem/mapbox`     | Elevation data in [Mapbox Terrain-RGB](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/#decode-data) encoding |
| `dem/terrarium`  | Elevation data in [Mapzen Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium) encoding            |
| `dem/versatiles` | Placeholder for a future Versatiles DEM                                                                                          |

### Vector values

| Schema value     | Vector tiles follow …                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `openmaptiles`   | The [OpenMapTiles schema](https://openmaptiles.org/schema/)           |
| `shortbread@1.0` | The [Shortbread 1.0 schema](https://shortbread-tiles.org/schema/1.0/) |
| `other`          | An unspecified/unknown/custom schema                                  |

> [!NOTE] > **Versioning recommendation** – If a schema has formal versions, append them after `@`, e.g. `shortbread@1.0`.

---

## Examples

### Terrarium DEM tiles (WebP)

```json
{
  "tilejson": "3.0.0",
  "name": "Global Hillshade (Terrarium)",
  "bounds": [-180, -85, 180, 85],
  "minzoom": 0,
  "maxzoom": 14,
  "tiles": ["{z}/{x}/{y}"],

  "tile_content": "raster",
  "tile_format": "image/webp",
  "tile_schema": "dem/terrarium"
}
```

### OSM vector tiles in the Shortbread schema

```json
{
  "tilejson": "3.0.0",
  "name": "OSM Vector — Shortbread",
  "tiles": ["{z}/{x}/{y}"],

  "tile_content": "vector",
  "tile_format": "application/vnd.mapbox-vector-tile",
  "tile_schema": "shortbread@1.0"
}
```
