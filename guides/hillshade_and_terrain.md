# How to add hillshading and 3D terrain

Relief makes a map much easier to read: hillshading shades the slopes, so mountains and valleys stand out, and 3D terrain lifts the map surface so it can be viewed at an angle. VersaTiles offers two tilesets for this:

| Tileset                                      | Type                             | Hillshading                                                   | 3D terrain | Hosted as           |
| -------------------------------------------- | -------------------------------- | ------------------------------------------------------------- | ---------- | ------------------- |
| [Elevation](../basics/tilesets.md#elevation) | raster (`raster-dem`, Terrarium) | computed by MapLibre in the browser, light and colours freely | yes        | `elevation`         |
| [Hillshade](../basics/tilesets.md#hillshade) | vector polygons                  | computed in advance, drawn as ordinary fill layers            | no         | `hillshade-vectors` |

For most maps, use **Elevation**: one source gives you both hillshading and 3D terrain. The vector [Hillshade](#vector-hillshading) tileset is the alternative for renderers that cannot handle `raster-dem` sources.

## With @versatiles/style

[@versatiles/style](https://github.com/versatiles-org/versatiles-style) adds hillshading and terrain to a generated style with two options: `features.hillshade` and `features.terrain`. Both use the hosted `elevation` tileset by default.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>VersaTiles - Terrain</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.js"></script>
    <script src="https://tiles.versatiles.org/assets/lib/versatiles-style/versatiles-style.js"></script>
    <link
      href="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.css"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="map" style="width: 100%; height: 80vh;"></div>
    <script>
      (async () => {
        const style = VersaTilesStyle.osm({
          theme: 'colorful',
          urls: { base: 'https://tiles.versatiles.org' },
          features: { hillshade: true, terrain: true },
        });

        const map = new maplibregl.Map({
          container: 'map',
          style: await VersaTilesStyle.inlineSources(style),
          center: [11.0, 46.85], // Ötztal Alps
          zoom: 10.5,
          pitch: 60,
          bearing: -20,
        });
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }));
        map.addControl(new maplibregl.TerrainControl({ source: 'elevation' }));
      })();
    </script>
  </body>
</html>
```

A few things to note:

- **`urls.base` is needed** when your page is not served by tiles.versatiles.org. By default, `osm()` resolves every tile, font and sprite URL against the origin of the current page, which is what you want when the page and the tiles come from [your own server](#self-hosting).
- **`inlineSources` is required.** The hosted TileJSON lists relative tile URLs, which MapLibre cannot resolve. `inlineSources` fetches the TileJSON and writes absolute tile URLs and the attribution into the style.
- **MapLibre GL JS 5.5 or newer** is required for the hillshade that @versatiles/style generates. The copy hosted on tiles.versatiles.org is recent enough.
- **Terrain is only visible when the map is pitched.** Hold the right mouse button (or `Ctrl` and the left one) and drag to tilt the map. The `TerrainControl` button switches terrain off and on; `elevation` is the name of the source that @versatiles/style creates.

Both features take options instead of `true`. `light` sets where the light comes from; it shades the terrain and 3D buildings from the same side:

```js
const style = VersaTilesStyle.osm({
  urls: { base: 'https://tiles.versatiles.org' },
  features: {
    hillshade: { exaggeration: 0.2, shadowColor: '#203040' }, // default exaggeration: 0.1
    terrain: { exaggeration: 1.5 }, // default: 1
  },
  light: { direction: 315, altitude: 30 }, // from the north-west, 30° above the horizon
});
```

Hillshading works without terrain, and terrain without hillshading — but terrain on its own is not shaded, so slopes are only visible from the side. `satellite()` takes the same `features.hillshade` and `features.terrain` options. All options are listed in the [@versatiles/style API documentation](https://versatiles.org/versatiles-style/types/_versatiles_style.OsmOptions.html).

## Adding it to an existing style

If you use a ready-made `style.json` — one of the [prebuilt styles](https://github.com/versatiles-org/versatiles-style/releases/latest/) or your own — you can add the elevation source and the layers at runtime:

```js
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json',
  center: [11.0, 46.85],
  zoom: 10.5,
  pitch: 60,
});

map.on('load', () => {
  map.addSource('elevation', {
    type: 'raster-dem',
    tiles: ['https://tiles.versatiles.org/tiles/elevation/{z}/{x}/{y}'],
    tileSize: 512,
    maxzoom: 12,
    encoding: 'terrarium',
    attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
  });

  // Draw the shading above land and water areas, but below roads, buildings and labels:
  // insert it before the first layer that is not a background, fill or raster layer.
  const beforeId = map
    .getStyle()
    .layers.find((layer) => !['background', 'fill', 'raster'].includes(layer.type))?.id;
  map.addLayer(
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'elevation',
      paint: { 'hillshade-exaggeration': 0.5 },
    },
    beforeId,
  );

  map.setTerrain({ source: 'elevation', exaggeration: 1.5 });
});
```

The position of the hillshade layer matters: added on top of everything, it darkens roads and labels too. The `hillshade` layer has more paint properties for colours and light direction, see the [MapLibre style specification](https://maplibre.org/maplibre-style-spec/layers/#hillshade). Terrain needs no layer at all; it is set on the map (or as `terrain` at the root of a `style.json`).

To edit a `style.json` file instead, add the same source, layer and `terrain` to it. The [Elevation section](../basics/tilesets.md#elevation) of the tilesets overview shows them as JSON. [Maputnik](https://maplibre.org/maputnik/) lets you do the same in a visual editor.

## Vector hillshading

The [Hillshade](../basics/tilesets.md#hillshade) tileset contains the shading as vector polygons: lighter and darker areas, computed in advance. They are drawn as ordinary `fill` layers, so they work in any renderer that reads vector tiles, also where `raster-dem` is not supported, and they are cheap to draw.

The trade-offs: there is no 3D terrain, the light direction is fixed, and the shading gets coarse above zoom level 12, the highest zoom level of the tileset. @versatiles/style does not generate these layers, so add the source and layers yourself — the [Hillshade section](../basics/tilesets.md#hillshade) of the tilesets overview has a complete example. As with the raster hillshade, insert the layers below roads and labels, for example with `beforeId` as shown above.

## Self-hosting

The examples above use tiles.versatiles.org, our demo server without uptime guarantees ([what to expect](use_tiles_versatiles_org.md#what-to-expect)). To serve the elevation data yourself, download [`elevation.versatiles`](https://download.versatiles.org/elevation.versatiles) (407 GB) or only the region you need, see [Partial download](download_tiles.md#partial-download):

```bash
versatiles convert --bbox "5.956,45.818,10.492,47.808" https://download.versatiles.org/elevation.versatiles elevation.versatiles
```

Then serve it next to the OSM tiles, with the names that @versatiles/style expects:

```bash
versatiles serve "[osm]osm.versatiles" "[elevation]elevation.versatiles"
```

If your page is served from the same server, leave out `urls.base`; otherwise set it to your server's address. For a hand-written source, replace `https://tiles.versatiles.org` in the tile URL.

## Attribution

The elevation data requires the attribution [© Mapterhorn](https://mapterhorn.com/attribution). @versatiles/style with `inlineSources` takes it from the TileJSON, and the manual example above sets it on the source, so MapLibre shows it automatically. The vector Hillshade tileset needs the [Mapzen Terrain Tiles attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) instead. The [tilesets overview](../basics/tilesets.md) lists the licence and attribution of each tileset.
