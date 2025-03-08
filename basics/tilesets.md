# Tilesets

## OSM Shortbread Vector Tiles

![Example of SOM Shortbread](../assets/example-osm-shortbread.png)

A set of general purpose vector tiles based on [OpenStreetMap](https://www.openstreetmap.org/) data using the [Shortbread Scheme](https://shortbread-tiles.org/schema/).

* [Download](https://download.versatiles.org/osm.versatiles)
* [Repository](https://github.com/versatiles-org/versatiles-generator)

### Style

There are [several ready-made Public Domain styles](https://github.com/versatiles-org/versatiles-style) available.

### License / Attribution

* OpenStreetMap data is licensed under [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/) and requires attribution to [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
* The Shortbread Scheme [is licensed](https://shortbread-tiles.org/copyright/) under [CC-0](https://shortbread-tiles.org/copyright/CC0-1.0-LICENSE.txt) and does not require additional attribution.



## Hillshade

![Example of Hillshade](../assets/example-hillshade.png)

A set of general purpose vector tiles for simulating a shaded relief. Based on [Mapzen Jörð Terrain Tiles](https://github.com/tilezen/joerd), inspired by [Datawrapper](https://www.datawrapper.de/blog/shaded-relief-with-gdal-python)

* [Download](https://download.versatiles.org/landcover-vectors.versatiles)

### Stlye

There is one layer called `hillshade-vectors` with a property `shade`:

* `light` Light Shades
* `dark` Dark Shades

#### Example

``` js
{
  // ...
  "sources": {
    "versatiles-hillshade": {
      "tilejson": "3.0.0",
      "name": "Versatiles Hillshade Vectors",
      "description": "Versatiles Hillshade Vectors based on Mapzen Jörð Terrain Tiles",
      "attribution": "<a href=\"https://github.com/tilezen/joerd/blob/master/docs/attribution.md\">Mapzen Terrain Tiles, DEM Sources</a>",
      "version": "1.0.0",
      "tiles": ["https://tiles.versatiles.org/tiles/hillshade-vectors/{z}/{x}/{y}"],
      "type": "vector",
      "scheme": "xyz",
      "format": "pbf",
      "bounds": [ -180, -85.0511287798066, 180, 85.0511287798066 ],
      "minzoom": 0,
      "maxzoom": 12,
      "vector_layers":[{ "id": "hillshade-vectors", "fields": { "shade": "String" }, "minzoom": 0 ,"maxzoom": 12 }]
    }
  },
  "layers": [
    {
      "id": "hillshade-light",
      "type": "fill",
      "source-layer": "hillshade-vectors",
      "source": "versatiles-hillshade",
      "filter": [ "all", ["==", "shade", "light"] ],
      "paint": {
        "fill-color": "#ffffff",
        "fill-opacity": 1,
        "fill-opacity": { "stops": [[0, 0], [4, 0.2]] },
        "fill-antialias": true,
        "fill-outline-color": "#ffffff00"
      }
    },
    {
      "id": "hillshade-dark",
      "type": "fill",
      "source-layer": "hillshade-vectors",
      "source": "versatiles-hillshade",
      "filter": [ "all", ["==", "shade", "dark"] ],
      "paint": {
        "fill-color": "#000000",
        "fill-opacity": 1,
        "fill-opacity": { "stops": [[0, 0], [4, 0.05]] },
        "fill-antialias": true,
        "fill-outline-color": "#00000000"
      }
    }
  ]
}
```

### License / Attribution

* [Mapzen Jörð Terrain Tiles](https://github.com/tilezen/joerd) ([Access via AWS](https://registry.opendata.aws/terrain-tiles/)) uses variously licensed sources with [attribution requirements](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
* The Versatiles Hillshade Vectors tileset is licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) carrying forward these attribution requirements



## Landcover

![Example of Landcover](../assets/example-landcover.png)

A set of vector tiles based on [ESA Worldcover](https://esa-worldcover.org/en/data-access) raster.
They are used to complement OSM tiles on lower zoom levels.

* [Download](https://download.versatiles.org/landcover-vectors.versatiles)
* [Repository](https://github.com/versatiles-org/landcover-vectors)

### Style

There is one layer called `landcover-vectors` with a property `kind`:

* `bare` Bare / sparse vegetation
* `builtup` Built-up
* `cropland` Cropland
* `grassland` Grassland
* `mangroves` Mangroves
* `moss` Moss and lichen
* `shrubland` Shrubland
* `snow` Snow and ice
* `treecover` Tree cover
* `water` Permanent water bodies
* `wetland` Herbaeceous wetland

#### Example

``` js
{
  // ...
  "sources": {
    "versatiles-landcover": {
      "tilejson": "3.0.0",
      "name": "Versatiles Landcover Vectors",
      "description": "Versatiles Hillshade Vectors based on ESA Worldcover 2021",
      "attribution": "<a href=\"https://esa-worldcover.org/en/data-access\">© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021)</a>",
      "version": "1.0.0",
      "tiles": ["https://tiles.versatiles.org/tiles/landcover-vectors/{z}/{x}/{y}"],
      "type": "vector",
      "scheme": "xyz",
      "format": "pbf",
      "bounds": [ -180, -85.0511287798066, 180, 85.0511287798066 ],
      "minzoom": 0,
      "maxzoom": 8,
      "vector_layers":[{ "id": "landcover-vectors", "fields": { "kind": "String" }, "minzoom": 0 ,"maxzoom": 12 }]
    }
  },
  "layers": [
    {
      "id": "landcover-bare",
      "type": "fill",
      "source-layer": "landcover-vectors",
      "source": "versatiles-landcover",
      "filter": [ "all", ["==", "kind", "bare"] ],
      "paint": {
        "fill-color": "#FAFAED",
        "fill-opacity": { "stops": [[0, 0.2], [10, 0.2], [11, 0]] },
        "fill-antialias": true,
        "fill-outline-color": "#ffffff00"
      }
    },
    // ...
  ]
}

```

### License / Attribution

* [ESA Worldcover](https://esa-worldcover.org/en/data-access) is licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
* The Versatiles Landcover Vectors tileset is derived from ESA Worldcover and therefore also licensed [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
