# VersaTiles Converter

The converter is a command in the [versatiles tool](https://github.com/versatiles-org/versatiles-rs) ([Install](https://github.com/versatiles-org/versatiles-rs?tab=readme-ov-file#installation)).

It can convert tileset between `versatiles`, `mbtiles` and `pmtiles` containers, `tar` archives and directories.

## Usage

``` sh
versatiles convert [options] <src> <dest>
```

## Examples

Convert an `mbtiles` container to `versatiles`:
``` sh
versatiles convert input.mbtiles dest.versatiles

```
Convert an directory containing tiles in `dir/z/x/y.ext` format to `pmtiles`:
``` sh
versatiles convert dir dest.pmtiles
```

## Options

See `versatiles convert --help` for a full listing of options.

## Convert GeoJSON to VersaTiles container

VersaTiles convert is not yet able to convert GeoJSON or other GIS formats to tilesets.
In the meantime we recommend using [tippecanoe](https://github.com/mapbox/tippecanoe) to generate an `mbtiles` container and then convert said container to the `versatiles` container format.

``` sh
tippecanoe -o tmp.mbtiles src.geojson
versatiles convert tmp.mbtiles dest.pmtiles
rm tmp.mbtiles
```
