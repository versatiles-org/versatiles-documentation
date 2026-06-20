# Shortbread Schema Extensions

> **Status** Experimental | Last updated 2026-06-19

## Introduction

VersaTiles generates its OpenStreetMap vector tiles with [Planetiler](https://github.com/onthegomap/planetiler) using the [Shortbread](https://shortbread-tiles.org/) schema.

That profile can emit a handful of features that are **not part of the official Shortbread 1.0/1.1 schema**. We call them **experiments**: they make richer maps possible (3D buildings, localized labels, …), but they may change, be renamed, or be removed, and some are being proposed upstream. They are kept deliberately separate so the default output stays spec-conformant.

Two principles hold for every experiment:

1. **Opt-in.** Nothing beyond the spec is emitted unless explicitly enabled. A bare build is strict Shortbread.
2. **Additive.** Experiments only _add_ attributes or features to existing layers — layer names, geometry types and zoom ranges are unchanged, and the `buildings` layer still carries the spec's `dummy=1`. A consumer that only understands base Shortbread can ignore the extras safely.

> This page documents the **schema contract** (what extra attributes/features exist and how to use them in a style). It is not the build manual — see the [profile README](https://github.com/versatiles-org/planetiler/blob/feature/shortbread-java-profile/planetiler-shortbread/README.md) for how tiles are generated.

---

## Enabling experiments

Experiments are switched on at **tile-generation time** with the `--shortbread_experiments` argument — a comma-separated list of `all`, `none`, or specific tokens:

```bash
# strict spec (default — nothing beyond Shortbread)
java -jar planetiler.jar shortbread --area=monaco

# everything on
java -jar planetiler.jar shortbread --area=monaco --shortbread_experiments=all

# a specific subset
java -jar planetiler.jar shortbread --area=monaco \
  --shortbread_experiments=building_heights,building_parts,locale_names
```

The default is **`none`**. The token registry is defined in [`Experiment.java`](https://github.com/versatiles-org/planetiler/blob/feature/shortbread-java-profile/planetiler-shortbread/src/main/java/com/onthegomap/planetiler/shortbread/Experiment.java) and is the source of truth.

> **For map authors:** experiments are chosen by whoever builds the tiles ([versatiles-generator](https://github.com/versatiles-org/versatiles-generator)), not by the map client. The published VersaTiles tiles ship a fixed set — check the generator configuration to see which. There is currently no per-tile metadata flag indicating which experiments were enabled (see [Future](#future)).

---

## Experiments

| Token              | Layer(s)         | Adds                                                              |
|--------------------|------------------|-------------------------------------------------------------------|
| `building_heights` | `buildings`      | `height`, `min_height`                                            |
| `building_parts`   | `buildings`      | `building:part` polygons + `hide_3d` (implies `building_heights`) |
| `locale_names`     | all label layers | geofenced `name_<lang>` fallback                                  |
| `island_labels`    | `place_labels`   | labels for islands mapped as polygons                             |
| `address_details`  | `addresses`      | `unit`, `block`                                                   |
| `bridge_names`     | `bridges`        | `name` (and `name_<lang>`)                                        |

### `building_heights`

Adds two integer-metre attributes to `buildings` for 3D extrusion, derived like OpenMapTiles:

- **`height`** — from `height` / `building:height`, else `building:levels` (or `levels`) × 3.66 m, else a 5 m default.
- **`min_height`** — from `min_height` / `building:min_height`, else `building:min_level` × 3.66 m. Emitted **only when greater than 0**.
- Implausible values (≥ 3660 m, almost always tagging errors) are dropped.

The spec `dummy=1` is still present. Upstream discussion: [shortbread-docs #77](https://github.com/shortbread-tiles/shortbread-docs/issues/77).

**Style usage** ([MapLibre `fill-extrusion`](https://maplibre.org/maplibre-style-spec/layers/#fill-extrusion)):

```json
{
  "type": "fill-extrusion",
  "source-layer": "buildings",
  "paint": {
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0]
  }
}
```

### `building_parts`

Implements OSM [Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple3DBuildingsV1) so multi-part buildings extrude correctly. It is meaningless without heights, so it **implies `building_heights`**.

- Emits `building:part` polygons into the `buildings` layer — but **only those carrying height information** (a bare part with no height would just add overlapping 2D footprints).
- The footprint of a building that has parts must not be extruded under them. The **`outline`-role member of a `type=building` relation** is tagged **`hide_3d=true`**.

**Style usage:** extrude every `buildings` feature _except_ `hide_3d`:

```json
"filter": ["!=", ["get", "hide_3d"], true]
```

> **Known gap** (as in OpenMapTiles): parts that merely overlap a footprint with **no `type=building` relation** cannot be detected cheaply, so those footprints do not get `hide_3d`.

### `locale_names`

Refines name localisation. Base Shortbread emits `name` and `name:<code>` from their own OSM tags only. With `locale_names`, a feature tagged with just `name`, located **inside a country whose default language is `<lang>`**, also receives `name_<lang>` (e.g. `name_de` inside Germany).

- Backed by a country → language lookup built from the Natural Earth [`ne_10m_admin_0_countries`](https://www.naturalearthdata.com/) dataset (downloaded at build time when the experiment is on). Only clearly **monolingual** countries are mapped; multilingual ones (CH, BE, LU, CA, …) are intentionally omitted to avoid mislabelling.
- It is the **geofenced** version of the Tilemaker reference's _global_ `name_<lang> = name` copy — so it does not mislabel a French town's name as German.
- Requested languages follow `--name_languages` (default `en,de`).

This makes three frontend label modes possible:

| Mode                  | Expression                                       |
|-----------------------|--------------------------------------------------|
| Local name            | `["get", "name"]`                                |
| Prefer language _X_   | `["coalesce", ["get","name_X"], ["get","name"]]` |
| **Only** language _X_ | `["get", "name_X"]` (blank elsewhere)            |

The "only language X" mode is the one that needs this experiment: without it, a German town tagged only `name` would have no `name_de`.

### `island_labels`

Base Shortbread only labels island **nodes**. This adds area-ranked label points for islands mapped as **polygons** (the common case), so larger islands appear at lower zoom. Output is the normal `place_labels` `kind=island`.

### `address_details`

Adds `unit` (from `addr:unit`) and `block` (from `addr:block`) to the `addresses` layer, beyond the spec's `housename` / `housenumber`.

### `bridge_names`

Adds `name` (and, with `locale_names`, `name_<lang>`) to `man_made=bridge` polygons in the `bridges` layer. Base Shortbread defines no name for bridges. Upstream discussion: [shortbread-docs #141](https://github.com/shortbread-tiles/shortbread-docs/issues/141).

---

## Spec vs. experiment, by layer

Attributes a style can always rely on, versus those that only appear when an experiment is enabled:

| Layer          | Spec attributes (always)      | Experiment attributes / features                                  |
|----------------|-------------------------------|-------------------------------------------------------------------|
| `buildings`    | `dummy`                       | `height`, `min_height`, `hide_3d`; extra `building:part` polygons |
| `addresses`    | `housename`, `housenumber`    | `unit`, `block`                                                   |
| `bridges`      | `kind`                        | `name`, `name_<lang>`                                             |
| `place_labels` | `kind`, `population`, `name…` | extra island-polygon label points                                 |
| name layers    | `name`, `name:<code>`-derived | geofenced `name_<lang>` fallback                                  |

---

## Deviations from the reference (always on)

Separate from the opt-in experiments above, the profile intentionally differs from the Geofabrik Tilemaker reference in a few places to fix clear bugs or improve quality. These ship **always** (no flag) and stay spec-conformant:

- **`boundaries` `admin_level`** clamped to `{2, 4}` (the schema enum); level 3/5+ are dropped.
- **`aerialways` `kind`** — OSM `rope_tow` (absent from the schema enum) is mapped to the generic `drag_lift`.
- **Multi-value names** — OSM uses `;` to join several names in one tag (e.g. `name=A;B`); only the first value is kept for a clean label.
- **Low-zoom label thinning** — `water_polygons_labels` and `place_labels` are thinned per grid cell at low/mid zoom (keeping the largest / most populous) to bound tile size.
- **`ocean`** — non-polygonal slivers (thin polygons that collapse to lines at low zoom) are dropped so the layer stays polygon-only.
- **`way_area`** is reported in Web-Mercator m² (matching the spec's projection note), not geodesic.

These (and smaller ones) are marked with `// DEVIATION:` in the code and listed in the [profile README](https://github.com/versatiles-org/planetiler/blob/feature/shortbread-java-profile/planetiler-shortbread/README.md#reference-and-deviations).

---

## Compatibility & stability

- **Additive guarantee.** Strict Shortbread consumers are unaffected — extensions never remove or retype spec data.
- **Experimental.** These attributes/features may change, be renamed, or be removed without a schema-version bump. Do not treat them as a stable contract; track the linked upstream issues.
- **Tile size.** `building_heights` and especially `building_parts` enlarge dense-city tiles (more attributes and features). Consider this when enabling them for a planet build.

---

## Future

- **`mountain_peaks`** — a planned new layer (`natural=peak`/`volcano`, elevation), off by default until proposed upstream ([shortbread-docs #137](https://github.com/shortbread-tiles/shortbread-docs/issues/137)).
- **Discoverability** — stamping the enabled experiments into the archive metadata so a client can detect them.

---

## References

- VersaTiles profile: [`planetiler-shortbread`](https://github.com/versatiles-org/planetiler/tree/feature/shortbread-java-profile/planetiler-shortbread) · [README](https://github.com/versatiles-org/planetiler/blob/feature/shortbread-java-profile/planetiler-shortbread/README.md) · [`Experiment.java`](https://github.com/versatiles-org/planetiler/blob/feature/shortbread-java-profile/planetiler-shortbread/src/main/java/com/onthegomap/planetiler/shortbread/Experiment.java)
- Shortbread schema: [shortbread-tiles.org](https://shortbread-tiles.org/) · [shortbread-docs](https://github.com/shortbread-tiles/shortbread-docs) (issues [#77](https://github.com/shortbread-tiles/shortbread-docs/issues/77), [#137](https://github.com/shortbread-tiles/shortbread-docs/issues/137), [#141](https://github.com/shortbread-tiles/shortbread-docs/issues/141))
- VersaTiles ecosystem: [versatiles-generator](https://github.com/versatiles-org/versatiles-generator) (build) · [versatiles-style](https://github.com/versatiles-org/versatiles-style) (consumer)
- OSM: [Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple3DBuildingsV1) · [`building:height`](https://wiki.openstreetmap.org/wiki/Key:height) · [`addr:*`](https://wiki.openstreetmap.org/wiki/Key:addr) · [semicolon value separator](https://wiki.openstreetmap.org/wiki/Semi-colon_value_separator)
- Rendering: [MapLibre `fill-extrusion`](https://maplibre.org/maplibre-style-spec/layers/#fill-extrusion) · data source [Natural Earth admin 0](https://www.naturalearthdata.com/)
