# Extended TileJSON 3.0

> **Status** Implemented | Last updated 2025-11-04

## Introduction

This extension defines **four optional metadata fields** for the [TileJSON 3.0 spec](https://github.com/mapbox/tilejson-spec/tree/master/3.0.0), enabling clients to understand tile content **before downloading the first tile**. These fields allow clients to pre-configure appropriate renderers and display fallback messages when unsupported tile types are encountered. Clients and servers that do not recognize these properties remain fully compatible, as this extension adds no required fields and preserves existing TileJSON semantics.

### Why extend TileJSON?

1. Clients cannot determine whether tiles are raster or vector. Therefore, we add `tile_type`.
2. Clients cannot determine whether tiles are RGB imagery, DEM, or other types. Therefore, we add `tile_schema`.
3. Clients cannot determine whether tiles are served as JPEG, PNG, or other formats. Therefore, we add `tile_format`.
4. Clients cannot determine whether image tiles have standard (256×256) or high resolution (512×512). Therefore, we add `tile_size`.
5. Neither tile source generators nor servers know the exact URLs under which tiles will be served. Therefore, we relax the rules for URLs in `tiles`.

---

## Property `tile_type`

`tile_type` indicates whether the source is a `"raster"` or `"vector"` tile source. All values must be lowercase.

| Value     | Meaning                           |
| --------- | --------------------------------- |
| `raster`  | Pixel tiles (imagery, DEM, etc.)  |
| `vector`  | Geometry/feature tiles (MVT, MLT) |
| `unknown` | Other types                       |

---

## Property `tile_schema`

`tile_schema` describes how to interpret the data. All values must be lowercase and follow the pattern **`<family>[/<subtype>][@<version>]`**

### Raster values

| Value            | Use case                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `rgb`            | 3-band imagery (no alpha)                                                                                                      |
| `rgba`           | 4-band imagery with alpha                                                                                                      |
| `dem/mapbox`     | Elevation data in [Mapbox Terrain-RGB](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/#decode-data) format |
| `dem/terrarium`  | Elevation data in [Mapzen Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium) format            |
| `dem/versatiles` | Placeholder for a future VersaTiles DEM                                                                                        |

### Vector values

| Value            | Vector tiles follow…                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `openmaptiles`   | The [OpenMapTiles schema](https://openmaptiles.org/schema/)           |
| `shortbread@1.0` | The [Shortbread 1.0 schema](https://shortbread-tiles.org/schema/1.0/) |
| `other`          | An unspecified, unknown, or custom schema                             |

> [!NOTE]  
> **Versioning recommendation:** If a schema has formal versions, append them after `@`, e.g., `shortbread@1.0`.

---

## Property `tile_format`

Any valid media type is allowed. All values must be lowercase. Non-standard types **should** use the `vnd.*` or `x.*` tree. The server should send tile content with the same `Content-Type` as defined in `tile_format`.

### Common raster formats

| Value        | Meaning     |
| ------------ | ----------- |
| `image/png`  | PNG images  |
| `image/jpeg` | JPEG images |
| `image/webp` | WebP images |
| `image/avif` | AVIF images |

### Common vector formats

| Value                                | Notes                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `application/vnd.mapbox-vector-tile` | Tiles follow the [Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec/tree/master/2.1) |

> [!NOTE]  
> MapLibre is developing the [MapLibre Tile specification](https://github.com/maplibre/maplibre-tile-spec) and may register its own MIME type in the future.

---

## Property `tile_size`

`tile_size` defines the size of tiles as a number. This applies only to raster tiles. The value should be `256` or `512`. Fractional or larger sizes (e.g., 1024) are allowed but not recommended.

---

## Relaxed rule for `tiles`

- `tiles` **may** contain relative URLs.
- Each URL **must** be resolved relative to the JSON document’s own location.

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

  "tile_type": "raster",
  "tile_format": "image/webp",
  "tile_schema": "dem/terrarium",
  "tile_size": 512
}
```

### OSM vector tiles in the Shortbread schema

```json
{
  "tilejson": "3.0.0",
  "name": "OSM Vector — Shortbread",
  "tiles": ["{z}/{x}/{y}"],

  "tile_type": "vector",
  "tile_format": "application/vnd.mapbox-vector-tile",
  "tile_schema": "shortbread@1.1"
}
```
