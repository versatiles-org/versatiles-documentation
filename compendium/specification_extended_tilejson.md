# Extended TileJSON 3.0

> **Status** Implemented | Last updated 2026-11-01

## Introduction

This extension defines **four optional metadata fields** for the [TileJSON 3.0 spec](https://github.com/mapbox/tilejson-spec/tree/master/3.0.0), enabling clients to understand tile content **before downloading the first tile**. These fields allow clients to pre-configure appropriate renderers and display fallback messages when unsupported tile types are encountered. Clients and servers that do not recognise these properties remain fully compatible, as this extension adds no required fields and preserves existing TileJSON semantics.

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

`tile_schema` describes how to interpret the data. All values must be lowercase and follow the pattern **`<family>[/<subtype>][@<version>]`**. Each part is made of one or more lowercase letters, digits, `.`, `_` or `-` (`[a-z0-9._-]+`). A value with a second `/` or `@`, an empty part or an uppercase letter is malformed.

### Raster values

| Value            | Use case                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `rgb`            | 3-band imagery (no alpha)                                                                                                      |
| `rgba`           | 4-band imagery with alpha                                                                                                      |
| `dem/mapbox`     | Elevation data in [Mapbox Terrain-RGB](https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/#decode-data) format |
| `dem/terrarium`  | Elevation data in [Mapzen Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium) format            |
| `dem/versatiles` | Placeholder for a future VersaTiles DEM                                                                                        |

### Vector values

| Value                      | Vector tiles follow…                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openmaptiles`             | The [OpenMapTiles schema](https://openmaptiles.org/schema/)                                                                                                       |
| `shortbread@1.0`           | The [Shortbread 1.0 schema](https://shortbread-tiles.org/schema/1.0/)                                                                                             |
| `shortbread@1.1`           | The [Shortbread 1.1 schema](https://shortbread-tiles.org/schema/1.1/)                                                                                             |
| `versatiles/landcover@1.0` | One layer, `landcover`, with one attribute, `kind`, as described in [What's in the tiles](https://github.com/versatiles-org/landcover-vectors#whats-in-the-tiles) |
| `other`                    | An unspecified or unrecognised schema                                                                                                                             |

> [!NOTE]  
> **Versioning recommendation:** If a schema has formal versions, append them after `@`, e.g., `shortbread@1.0`.

### Other defined values

| Value     | Meaning                                                                        |
| --------- | ------------------------------------------------------------------------------ |
| `unknown` | Nothing can be said about the tiles, for example because their type is unknown |

### Values a client doesn't know

A dataset may declare any well-formed value, also one that isn't listed here, so it can name its schema before every tool has heard of it. TileJSON's own rule covers unknown keys, not unknown values, so this applies:

- A client keeps a well-formed `tile_schema` value it doesn't know, passes it on unchanged, and ignores its meaning.
- A value starting with `dem/` is elevation data even if the client doesn't know the subtype. A client that can't decode it must not treat the tiles as imagery, for example by interpolating or lossily encoding them. A client that doesn't handle elevation at all needn't do anything. On vector tiles, such a value can't be right, and a client may replace it.
- The tile type comes from `tile_type` and `tile_format`, not from an unknown schema.
- A malformed value may be ignored.

versatiles behaves this way from version 5.6.0 on. Older versions drop such a value or replace it with a guess.

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
| `application/vnd.maplibre-tile`      | Tiles follow the [MapLibre Tile Specification](https://maplibre.org/maplibre-tile-spec/)                        |

> [!NOTE]  
> MapLibre has not registered a media type for MLT yet. `application/vnd.maplibre-tile` is the type used by MapLibre tools and may change if an official type is registered. Some tools use the older `application/vnd.maplibre-vector-tile`.

---

## Property `tile_size`

`tile_size` defines the size of tiles as a number. This applies only to raster tiles. The value should be `256` or `512`. Fractional or larger sizes (e.g., 1024) are allowed but not recommended.

---

## Relaxed rule for `tiles`

The [TileJSON 3.0 spec](https://github.com/mapbox/tilejson-spec/blob/master/3.0.0/README.md#32-tiles) requires absolute URLs in the `tiles` property. This was designed with the assumption that tiles are served from a single, known domain. For self-hosted tile servers, this assumption does not hold:

- **Hardcoding the server URL at startup** breaks when the server is behind a CDN, a reverse proxy, or reachable under multiple hostnames.
- **Deriving the URL from the HTTP request** requires correct forwarding of `Host` and `X-Forwarded-*` headers through every proxy, adding fragile configuration.

Since TileJSON references resources on the same host under the same path prefix, this is precisely the use case relative URLs were designed for.

### Rule

- `tiles` **may** contain relative URL templates.
- Each URL **must** be resolved relative to the JSON document’s own location.

### Example

The file at `https://example.org/tiles/osm/tiles.json` contains:

```json
{
  "tiles": ["{z}/{x}/{y}"],
  …
}
```

A client resolves this to `https://example.org/tiles/osm/{z}/{x}/{y}`.

### Client implementation note

> [!WARNING]
> JavaScript’s `URL` class will percent-encode curly braces in template variables (e.g. `%7Bz%7D` instead of `{z}`). After resolving, replace `%7B` → `{` and `%7D` → `}`:
>
> ```js
> function resolveUrl(base, url) {
>   url = new URL(url, base).href;
>   return url.replace(/%7B/gi, '{').replace(/%7D/gi, '}');
> }
> ```

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
  "tile_schema": "shortbread@1.0"
}
```
