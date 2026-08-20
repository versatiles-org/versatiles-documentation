# VersaTiles Converter

The converter is a command in the [versatiles tool](https://github.com/versatiles-org/versatiles-rs) ([Install](https://github.com/versatiles-org/versatiles-rs?tab=readme-ov-file#installation)).

It can convert tileset between `versatiles`, `mbtiles` and `pmtiles` containers, `tar` archives and directories.

## Usage

```sh
versatiles convert [options] <src> <dest>
```

## Examples

Convert an `mbtiles` container to `versatiles`:

```sh
versatiles convert input.mbtiles dest.versatiles

```

Convert an directory containing tiles in `dir/z/x/y.ext` format to `pmtiles`:

```sh
versatiles convert dir dest.pmtiles
```

## Key Options

| Option                  | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `--bbox <W,S,E,N>`      | Crop tiles to this geographic bounding box (decimal degrees)  |
| `--bbox-border <tiles>` | Expand the bounding box by this many extra tiles on each side |
| `--min-zoom <z>`        | Discard tiles below this zoom level                           |
| `--max-zoom <z>`        | Discard tiles above this zoom level                           |
| `--tile-format <fmt>`   | Re-encode raster tiles — `avif`, `jpg`, `png` or `webp`       |
| `-c, --compress <alg>`  | Re-compress tiles — `uncompressed`, `gzip`, `brotli`, `zstd`  |

`--tile-format` optionally takes a quality and an effort value, e.g. `webp,80` or `avif,90,50`. It only converts **between raster formats** — vector tiles cannot be re-encoded, so there is no `pbf` target.

Run `versatiles convert --help` for the full option listing, including `--flip-y` and `--swap-xy`.

### Compression when writing MBTiles

MBTiles cannot store arbitrary combinations of format and compression: vector tiles must be **gzipped**, raster tiles must be **uncompressed**. Set the compression explicitly with `-c`:

```sh
# vector tiles
versatiles convert -c gzip osm.versatiles osm.mbtiles

# raster tiles
versatiles convert -c uncompressed satellite.versatiles satellite.mbtiles
```

Without `-c`, the output keeps the compression of the source, which MBTiles usually rejects.

The `versatiles`, `pmtiles` and `tar` targets accept any combination.

## Convert GeoJSON and other GIS data

`versatiles convert` also accepts a [VPL pipeline](https://github.com/versatiles-org/versatiles-rs) as its input, so vector geo data can be turned into tiles in a single step. The `from_geo` operation reads GeoJSON (`.geojson`, `.json`), line-delimited GeoJSON (`.ndjson`, `.geojsonl`, `.geojsonseq`) and Esri Shapefiles (`.shp`):

```sh
versatiles convert '[,vpl](from_geo filename="places.geojson" layer_name="places" max_zoom=12)' places.versatiles
```

The `[,vpl](…)` prefix marks the argument as an inline pipeline rather than a filename. You can also write the pipeline into a `.vpl` file and pass that file instead.

Useful `from_geo` parameters:

| Parameter                                   | Description                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `layer_name`                                | Name of the layer in the output tiles (default: the filename stem) |
| `min_zoom` / `max_zoom`                     | Zoom range to emit                                                 |
| `properties_include` / `properties_exclude` | Keep only, or drop, the named feature properties                   |
| `polygon_simplify` / `line_simplify`        | Douglas-Peucker tolerance in tile pixels (default 4)               |
| `point_reduction_value`                     | Minimum distance between kept points, in tile pixels (default 16)  |

> [!TIP]
> Set `max_zoom` explicitly. If you omit it, the zoom range is guessed from the median size of the **line and polygon** features — point geometries are not measured at all. A dataset that is mostly points but contains a few large polygons can therefore end up with a far lower maximum zoom than you want.

For tabular point data, `from_csv` reads longitude and latitude columns directly:

```sh
versatiles convert '[,vpl](from_csv filename="quakes.csv" lon_column="longitude" lat_column="latitude")' quakes.versatiles
```

Run `versatiles help pipeline` for the full list of operations, and `versatiles help source` for the data-source syntax.

If you already have a [tippecanoe](https://github.com/mapbox/tippecanoe)-based workflow, you can of course keep it and convert its output:

```sh
tippecanoe -o tmp.mbtiles src.geojson
versatiles convert tmp.mbtiles dest.versatiles
rm tmp.mbtiles
```
