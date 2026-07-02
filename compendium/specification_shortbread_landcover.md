# Shortbread Low-Zoom Land Cover

> **Status** Experimental | Last updated 2026-06-20

## Introduction

[Shortbread](https://shortbread-tiles.org/)'s `land` layer is derived purely from OpenStreetMap, and most of its kinds only appear at higher zoom levels (`forest` from z7, the other land kinds later still); the separate `water_polygons` layer starts at z4. A worldwide map at zoom 0–6 therefore shows almost no land cover — only ocean, large water bodies, boundaries and labels.

This page describes an **optional, complementary tileset** that fills that gap. It is derived from [ESA WorldCover](https://esa-worldcover.org/) — a global 10 m satellite land-cover classification — and populates Shortbread's **existing** `land` and `water_polygons` layers, using their **existing** `kind` values, at the low zoom levels where OSM does not yet provide them. Where OSM begins, the satellite data stops.

Unlike the [Shortbread schema extensions](specification_shortbread_extensions.md) — which add _attributes_ to the OSM/Planetiler tileset — this is a **separate tileset from a different source**, produced by [versatiles-org/landcover-vectors](https://github.com/versatiles-org/landcover-vectors) and can be optionally merged with the OSM tileset. It adds no new layers or attributes.

> This page documents the **contract** — what the tileset contains and how to consume it. The build pipeline is documented in the [landcover-vectors README](https://github.com/versatiles-org/landcover-vectors#how-its-made).

Two principles, mirroring the schema extensions:

1. **Opt-in.** It is a standalone tileset. Merge it to get low-zoom land cover; do nothing and the map is unchanged.
2. **Additive & spec-conformant.** It writes only into existing Shortbread layers, with existing `kind` values, only _below_ the zoom where OSM introduces each kind. A base-Shortbread consumer sees ordinary `land` / `water_polygons` features.

---

## Why a separate tileset

OpenStreetMap is precise but incomplete and uneven at the global scale. A rough comparison for forest illustrates the point: rasterising OSM forest (`natural=wood` + `landuse=forest`) onto an equal-area grid gives roughly **18.5 million km²**, against the FAO Forest Resources Assessment 2020 figure of **~40.6 million km²** — so OSM represents about **46%** of the world's forest area, with the gaps concentrated in the tropics, Central Africa and Siberia while Europe and North America are near-complete.

This unevenness is part of why Shortbread introduces land cover only at higher zoom levels: rendering sparse, regionally inconsistent cover at z0–6 can look worse than rendering none. Crowd-sourced global land cover is genuinely hard — this tileset does not try to fix OSM; it provides a complete-but-coarse base for the zoom levels where OSM's detail is not needed yet.

---

## ESA WorldCover → Shortbread mapping

Each [ESA WorldCover](https://esa-worldcover.org/en/data-access) class maps to one Shortbread layer and `kind`, emitted only up to the zoom listed (one below Shortbread's minimum zoom for that value, so the satellite data hands over cleanly to OSM):

| ESA WorldCover class                    | → layer          | `kind`        | fills |
| --------------------------------------- | ---------------- | ------------- | ----- |
| Tree cover                              | `land`           | `forest`      | z0–6  |
| Cropland                                | `land`           | `farmland`    | z0–9  |
| Built-up                                | `land`           | `residential` | z0–9  |
| Bare / sparse vegetation                | `land`           | `bare_rock`   | z0–9  |
| Moss & lichen                           | `land`           | `heath`       | z0–9  |
| Shrubland                               | `land`           | `scrub`       | z0–10 |
| Grassland                               | `land`           | `grassland`   | z0–10 |
| Herbaceous wetland                      | `land`           | `marsh`       | z0–10 |
| Mangroves                               | `land`           | `swamp`       | z0–10 |
| Snow and ice                            | `water_polygons` | `glacier`     | z0–3  |
| Permanent water bodies                  | `water_polygons` | `water`       | z0–3  |
| No data / open ocean                    | —                | _(dropped)_   | —     |

Several mappings are deliberate, lossy generalisations — acceptable at these zooms, where the detail is not visible:

- **Built-up → `residential`** — ESA's single built-up class cannot distinguish residential / industrial / commercial.
- **Bare / sparse vegetation → `bare_rock`** — this class conflates rocky/gravelly barrens (Iceland, tundra, high mountains) with sandy deserts, which ESA cannot tell apart; `bare_rock` renders neutrally for both, where `sand` would tint every barren yellow. Sandy deserts lose their sand tint as a result.
- **Moss & lichen → `heath`** — Shortbread has no moss/lichen value; `heath` is the closest low tundra vegetation fill.
- **Wetland split** — herbaceous wetland → `marsh`, mangroves → `swamp`.

Open ocean (ESA no-data) is dropped, leaving those areas to Shortbread's `ocean` layer. The canonical, versioned mapping lives in the repository: [ESA WorldCover → Shortbread mapping](https://github.com/versatiles-org/landcover-vectors#esa-worldcover--shortbread-mapping).

---

## Using it

### 1. Get a merged OSM + land-cover tileset

You need one tileset in which the land cover and the OSM data populate the same `land` / `water_polygons` layers. There are two ways to get there.

#### Shortcut: download the pre-merged tileset (recommended)

We publish the OSM and land-cover tilesets already merged, so you can skip the merge entirely:

- **[Download `osm-landcover.versatiles`](https://download.versatiles.org/#osm-landcover)** — the OSM Shortbread tileset with low-zoom land cover already blended in, ready to use with no further processing.

This is the fastest option and avoids the lengthy merge step.

#### Merge it yourself

If you need a custom combination — for example a different OSM build, or land cover only over a region — merge the two source tilesets at the feature level so both populate the same `land` / `water_polygons` layers. The result is one tileset with continuous land cover from z0.

Obtain the [prepared `landcover-vectors.versatiles`](https://download.versatiles.org/#landcover-vectors) (or build it yourself from [versatiles-org/landcover-vectors](https://github.com/versatiles-org/landcover-vectors)), then merge it with an OSM-based Shortbread tileset using the [VersaTiles CLI](https://github.com/versatiles-org/versatiles-rs). A VPL pipeline can do the download and merge in one go:

```bash
versatiles convert '[,vpl](from_merged_vector [ from_container filename="https://download.versatiles.org/osm.versatiles", from_container filename="https://download.versatiles.org/landcover-vectors.versatiles" ])' combined.versatiles
```

> [!NOTE]
> The merge is processing-heavy: it is slow at first for the lower zoom levels, then speeds up, but can still take hours overall. This is exactly the work the pre-merged `osm-landcover.versatiles` saves you.

### 2. Render at low zoom

Most Shortbread styles only style these kinds from their OSM minimum zoom. To _see_ the low-zoom cover, the style must draw `land` / `water_polygons` at the lower zooms too ([versatiles-style #115](https://github.com/versatiles-org/versatiles-style/issues/115)).

Because it is purely additive, omitting the merge (or the style rules) changes nothing.

---

## Attribution & licensing

ESA WorldCover is licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and requires the attribution:

> © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium

When merged with OpenStreetMap data (ODbL), **both** attributions must be shown. The generated tileset is derived from ESA WorldCover and is therefore also CC BY 4.0.

---

## References

- VersaTiles generator: [landcover-vectors](https://github.com/versatiles-org/landcover-vectors) ([Shortbread compatibility](https://github.com/versatiles-org/landcover-vectors#shortbread-compatibility) · [mapping](https://github.com/versatiles-org/landcover-vectors#esa-worldcover--shortbread-mapping) · [how it's made](https://github.com/versatiles-org/landcover-vectors#how-its-made))
- Related: [Shortbread schema extensions](specification_shortbread_extensions.md) (attribute extensions in the OSM tileset)
- Source data: [ESA WorldCover](https://esa-worldcover.org/) · [data access & legend](https://esa-worldcover.org/en/data-access)
- Shortbread schema: [shortbread-tiles.org](https://shortbread-tiles.org/) · scope decision [shortbread-docs #144](https://github.com/shortbread-tiles/shortbread-docs/issues/144)
- Rendering: [versatiles-style #115](https://github.com/versatiles-org/versatiles-style/issues/115)
- Data-source listing: [versatiles.org/sources](https://versatiles.org/sources/)
- Coverage figure: [FAO Forest Resources Assessment 2020](https://www.fao.org/interactive/forest-resources-assessment/2020/en/)
