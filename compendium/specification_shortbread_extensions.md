# Shortbread Schema Extensions

> **Status** Experimental | Last updated 2026-09-11

VersaTiles generates its OpenStreetMap vector tiles with [Planetiler](https://github.com/onthegomap/planetiler) and the [planetiler-shortbread](https://github.com/versatiles-org/planetiler-shortbread) profile, in the [Shortbread](https://shortbread-tiles.org/) schema 1.1.

The profile can emit a few features that are **not part of the Shortbread schema**. They are called **experiments**: they make richer maps possible, but they may change, be renamed or be removed, and some are proposed upstream. This page is a short overview; the full contract of each experiment — attributes, when they are present, how they are derived, style snippets and caveats — lives in the profile repository: [**docs/extensions.md**](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md).

## Which tiles have them

Experiments are chosen when the tiles are generated, with `--shortbread_experiments` (`all`, `none` or a list of tokens). They are off by default. The [published VersaTiles tiles](../basics/tilesets.md) ship **all** of them: the [versatiles-planetiler](../guides/generate_tiles_from_osm.md) image defaults to `EXPERIMENTS=all`, with `LANGUAGES=en,fr,es,de,ar,el,it,nl,pl,pt,uk`.

## Experiments

| Token                                                                                                                       | Layers            | Adds                                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| [`3d_buildings`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#3d_buildings)         | `buildings`       | `height`, `min_height`, `hide_3d`; `building:part` polygons marked `part=true` |
| [`locale_names`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#locale_names)         | layers with names | `name_<lang>` from `name` inside countries whose language is `<lang>`          |
| [`island_labels`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#island_labels)       | `place_labels`    | label points for islands mapped as polygons                                    |
| [`address_details`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#address_details)   | `addresses`       | `unit`, `block`                                                                |
| [`bridge_names`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#bridge_names)         | `bridges`         | `name`, `name_<code>`                                                          |
| [`early_attributes`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#early_attributes) | `streets`         | `link` from z5 and `service` from z10, instead of z11                          |
| [`mountain_peaks`](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md#mountain_peaks)     | `mountain_peaks`  | a new point layer: peaks and volcanoes from z10, saddles at z14, with `ele`    |

The former tokens `building_heights` and `building_parts` are deprecated and enable `3d_buildings`.

## What map authors should know

- **Not all experiments are additive.** `3d_buildings` adds part polygons to `buildings` (a 2D style filters them with `["!", ["has", "part"]]`), `island_labels` adds `place_labels` points, `locale_names` fills `name_<lang>` from `name`, and `mountain_peaks` adds a layer the schema does not define. The others only add attributes or make them available at lower zooms.
- **Detecting them:** the `vector_layers` in `tiles.json` can show `3d_buildings` (`height`, `hide_3d`, `part` on `buildings`), `address_details` (`unit`, `block` on `addresses`), `bridge_names` (`name` on `bridges`) and `mountain_peaks` (a layer of that name). `locale_names`, `island_labels` and `early_attributes` add no fields and cannot be detected at all. Note that `vector_layers` lists the layers and fields that actually occur in the tiles, not the ones the profile was told to emit: a region without a single `natural=peak` has no `mountain_peaks` layer even with the experiment enabled, so a missing entry means "not present in this data", not "not enabled".
- **Always-on behavior** that is not an experiment — density limits on `addresses`, `place_labels` and `water_polygons_labels`, boundary lines from relations only, multi-value names kept whole — is listed in the profile README under [Notable output details](https://github.com/versatiles-org/planetiler-shortbread/blob/main/README.md#notable-output-details).

## References

- Profile: [planetiler-shortbread](https://github.com/versatiles-org/planetiler-shortbread) · [README](https://github.com/versatiles-org/planetiler-shortbread/blob/main/README.md) · [docs/extensions.md](https://github.com/versatiles-org/planetiler-shortbread/blob/main/docs/extensions.md)
- Shortbread schema: [shortbread-tiles.org](https://shortbread-tiles.org/) · [shortbread-docs](https://github.com/shortbread-tiles/shortbread-docs)
- VersaTiles: [versatiles-planetiler](../guides/generate_tiles_from_osm.md) (build) · [versatiles-style](https://github.com/versatiles-org/versatiles-style) (consumer)
