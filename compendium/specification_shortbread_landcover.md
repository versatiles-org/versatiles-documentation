# Land Cover Tileset

> **Status** Experimental | Last updated 2026-11-02

## Introduction

[Shortbread](https://shortbread-tiles.org/)'s `land` layer is derived purely from OpenStreetMap, and most of its kinds only appear at higher zoom levels (`forest` from z7, the other land kinds later still); the separate `water_polygons` layer starts at z4. A worldwide map at zoom 0–6 therefore shows almost no land cover — only ocean, large water bodies, boundaries and labels. Even at higher zoom levels, land that OSM doesn't map stays empty.

This page describes an **optional, complementary tileset** that fills those gaps. It combines [ESA WorldCover](https://esa-worldcover.org/) — a global 10 m satellite land-cover classification — with OpenStreetMap's land use, in one layer, `landcover`, with one attribute, `kind`, at zoom 0–10. A style draws it as a **separate source under OSM**: OSM paints over it wherever it has data, and it shows wherever OSM has none.

Unlike the [Shortbread schema extensions](specification_shortbread_extensions.md) — which add _attributes_ to the OSM/Planetiler tileset — this is a **separate tileset**, produced by [versatiles-org/landcover-vectors](https://github.com/versatiles-org/landcover-vectors). It isn't part of the Shortbread schema, although its `kind` values are Shortbread's, so that a style can reuse its colours. The container declares [`tile_schema`](specification_extended_tilejson.md#property-tile_schema) `versatiles/landcover@1.0`.

> This page documents the **contract** — what the tileset contains and how to consume it. The build pipeline is documented in the [landcover-vectors README](https://github.com/versatiles-org/landcover-vectors#how-it-works).

Two principles:

1. **Opt-in.** It is a standalone tileset. Add it to a style to get land cover; do nothing and the map is unchanged.
2. **Nothing is merged.** It has its own layer and is drawn from its own source. OSM's tiles stay as they are, and neither source needs filtering.

---

## Why a separate tileset

OpenStreetMap is precise but incomplete and uneven at the global scale. A rough comparison for forest illustrates the point: rasterising OSM forest (`natural=wood` + `landuse=forest`) onto an equal-area grid gives roughly **18.5 million km²**, against the FAO Forest Resources Assessment 2020 figure of **~40.6 million km²** — so OSM represents about **46%** of the world's forest area, with the gaps concentrated in the tropics, Central Africa and Siberia while Europe and North America are near-complete.

This unevenness is part of why Shortbread introduces land cover only at higher zoom levels: rendering sparse, regionally inconsistent cover at z0–6 can look worse than rendering none. Crowd-sourced global land cover is genuinely hard — this tileset does not try to fix OSM; it provides a complete-but-coarse base underneath it.

### Why a separate source

Up to version 3, the land cover was merged into OSM's `land` and `water_polygons` layers, and OSM took over at z11. But OSM maps only part of the land at z11, so outside Central Europe and the large rainforests, most of the coloured land turned into the style's background there. As a separate source under OSM, it stays. The [landcover-vectors README](https://github.com/versatiles-org/landcover-vectors#using-it-with-osm) has per-region figures.

---

## ESA WorldCover → `kind` mapping

Each [ESA WorldCover](https://esa-worldcover.org/en/data-access) class maps to one `kind` in the `landcover` layer, at z0–10. The last column is the Shortbread layer in which OSM has that kind, and whose fill a style copies for it:

| ESA WorldCover class     | `kind`        | OSM's layer      |
| ------------------------ | ------------- | ---------------- |
| Tree cover               | `forest`      | `land`           |
| Cropland                 | `farmland`    | `land`           |
| Built-up                 | `residential` | `land`           |
| Bare / sparse vegetation | `bare_rock`   | `land`           |
| Moss & lichen            | `heath`       | `land`           |
| Shrubland                | `scrub`       | `land`           |
| Grassland                | `grassland`   | `land`           |
| Herbaceous wetland       | `marsh`       | `land`           |
| Mangroves                | `swamp`       | `land`           |
| Snow and ice             | `glacier`     | `water_polygons` |
| Permanent water bodies   | `water`       | `water_polygons` |
| No data                  | _(dropped)_   | —                |

Several mappings are deliberate, lossy generalisations — acceptable at these zooms, where the detail is not visible:

- **Built-up → `residential`** — ESA's single built-up class cannot distinguish residential / industrial / commercial.
- **Bare / sparse vegetation → `bare_rock`** — this class conflates rocky/gravelly barrens (Iceland, tundra, high mountains) with sandy deserts, which ESA cannot tell apart; `bare_rock` renders neutrally for both, where `sand` would tint every barren yellow. Sandy deserts lose their sand tint as a result.
- **Moss & lichen → `heath`** — Shortbread has no moss/lichen value; `heath` is the closest low tundra vegetation fill.
- **Wetland split** — herbaceous wetland → `marsh`, mangroves → `swamp`.

The canonical, versioned mapping lives in the repository: [What's in the tiles](https://github.com/versatiles-org/landcover-vectors#whats-in-the-tiles).

### OSM's land use

The tileset is not pure ESA data. OSM's land use is burned into ESA's classes before the tiles are generalised: urban land as built-up, fields as cropland, parks and allotments as grassland, woods as tree cover. So where the two disagree, OSM wins: ESA sees trees in a leafy suburb, but OSM maps it as residential.

As a result, at z10 the towns are OSM's. All of OSM's urban kinds (`industrial`, `commercial`, `retail`, `railway`, …) end up as `residential`. Where OSM maps nothing, ESA's classification shows.

### The sea

The sea is a hole for Shortbread's `ocean` layer to fill. It is masked with OSM's sea polygons, the ones `ocean` is built from, so the land cover ends at OSM's coastline. ESA's own sea, which it classifies as permanent water along the coasts, never becomes `water`. Lakes are not part of OSM's sea and stay.

---

## Using it

### 1. Get the tiles

- **Hosted:** `https://tiles.versatiles.org/tiles/landcover-vectors/tiles.json`, on our [demo server](../guides/use_tiles_versatiles_org.md).
- **Download:** [`landcover-vectors.versatiles`](https://download.versatiles.org/#landcover-vectors), to [serve it yourself](../basics/versatiles_server.md).
- **Build:** see [versatiles-org/landcover-vectors](https://github.com/versatiles-org/landcover-vectors#building).

Use it together with plain OSM Shortbread tiles, such as the hosted `osm` tileset or `osm.versatiles`.

### 2. Draw it under OSM

The style has two vector sources, and draws, bottom to top:

1. the background
2. the land cover's fills
3. OSM's `ocean`
4. OSM's other layers, unchanged

OSM's own forests, lakes and towns draw on top wherever OSM has them, so nothing needs filtering.

#### With @versatiles/style

[@versatiles/style](https://github.com/versatiles-org/versatiles-style) does this from v8 on:

```js
import { osm } from '@versatiles/style';

const style = osm({ theme: 'colorful', features: { landcover: true } });
```

This adds the source and 9 fills, in every theme. The source defaults to the hosted tileset. If you serve it yourself, set `urls.landcover`:

```js
const style = osm({
  theme: 'colorful',
  features: { landcover: true },
  urls: { landcover: '/tiles/landcover-vectors/tiles.json' },
});
```

`osm.supportsLandcover(tileJSON)` tells whether a tileset can be used for this.

> [!NOTE]
> The option is off by default in `osm()`. The prebuilt OSM styles at `https://tiles.versatiles.org/assets/styles/` turn it on from v8.1 on, so they draw the land cover from the hosted tileset.

> [!WARNING]
> Before v8, `features.landcover` did something else: it expected the land cover to be merged into OSM's tiles, and added no source. On plain OSM tiles, it only makes the fills appear abruptly.

#### With a style of your own

Add the land cover as a second source:

```json
{
  "sources": {
    "landcover": {
      "type": "vector",
      "url": "https://tiles.versatiles.org/tiles/landcover-vectors/tiles.json"
    }
  }
}
```

Then add a copy of your fill for each group of kinds, right above the background. In the copy, set `source` and `source-layer`, filter by `kind`, remove `minzoom`, and replace `fill-opacity`. For the forest of the colorful style:

```json
{
  "id": "landcover-land-forest",
  "type": "fill",
  "source": "landcover",
  "source-layer": "landcover",
  "filter": ["in", ["get", "kind"], ["literal", ["forest"]]],
  "paint": {
    "fill-color": "rgb(203,229,184)",
    "fill-opacity": ["interpolate", ["linear"], ["zoom"], 12, 1, 14, 0.25]
  }
}
```

The tiles end at z10, and MapLibre overzooms them above that. So the land cover is opaque up to z12, where its outlines grow coarse, fades to 25 % by z14, and stays at 25 % above that, so land that OSM doesn't map keeps a hint of colour.

If you build on a style from @versatiles/style, `osm.slots.belowFills` is the place for these fills. It has been available since v6, so this also works with older versions.

---

## Attribution & licensing

Because of the burned-in land use, the tileset is licensed under the [ODbL](https://opendatacommons.org/licenses/odbl/), and contains ESA WorldCover data under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Both attributions must be shown:

> © OpenStreetMap contributors

> © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium

---

## References

- VersaTiles generator: [landcover-vectors](https://github.com/versatiles-org/landcover-vectors) ([what's in the tiles](https://github.com/versatiles-org/landcover-vectors#whats-in-the-tiles) · [using it with OSM](https://github.com/versatiles-org/landcover-vectors#using-it-with-osm) · [how it works](https://github.com/versatiles-org/landcover-vectors#how-it-works))
- Related: [Shortbread schema extensions](specification_shortbread_extensions.md) (attribute extensions in the OSM tileset)
- Source data: [ESA WorldCover](https://esa-worldcover.org/) · [data access & legend](https://esa-worldcover.org/en/data-access)
- Shortbread schema: [shortbread-tiles.org](https://shortbread-tiles.org/) · scope decision [shortbread-docs #144](https://github.com/shortbread-tiles/shortbread-docs/issues/144)
- Rendering: [versatiles-style #145](https://github.com/versatiles-org/versatiles-style/issues/145) (released in [v8.0.0](https://github.com/versatiles-org/versatiles-style/releases/tag/v8.0.0))
- Data-source listing: [versatiles.org/sources](https://versatiles.org/sources/)
- Coverage figure: [FAO Forest Resources Assessment 2020](https://www.fao.org/interactive/forest-resources-assessment/2020/en/)
