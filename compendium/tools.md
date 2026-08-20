# Tools

Web tools and libraries built around the VersaTiles ecosystem.

## Available

- **[Playground](https://versatiles.org/playground/)**: Live preview of all built-in map styles — switch themes, compare styles, and explore the default tile data without any setup.
- **[Map Editor](https://versatiles.org/versatiles-map-editor/)**: Draw and style markers, lines, circles and polygons on a vector map, then share the result through a self-contained URL — useful for locator maps, area maps and point maps in stories. Embeddable in other pages ([repository](https://github.com/versatiles-org/versatiles-map-editor)).
- **[GeoJSON BBOX Tool](https://versatiles.org/tools/bounding_box)**: Select a bounding box on a map and export the coordinates in various formats.
- **[Server Installer](https://versatiles.org/tools/setup_server)**: Generates customised shell commands for setting up a map server on Linux, macOS, Raspberry Pi, Windows and more.
- **[Style-Maker](https://github.com/versatiles-org/maplibre-versatiles-styler)**: A MapLibre plugin for customising map styles — colours, fonts and language settings.
- **[SVG Renderer](https://github.com/versatiles-org/versatiles-svg-renderer)**: A JavaScript library for rendering map regions as SVG, suitable for static map generation on the frontend or backend.

## In development

Usable enough to try, but still changing. Don't build anything load-bearing on them yet.

- **[VersaTiles Studio](https://github.com/versatiles-org/versatiles-studio)**: A cross-platform desktop application for working with map tiles — open and inspect containers, build processing pipelines, design styles and produce new tile sets, without a terminal and without a full GIS. Built on [Tauri](https://tauri.app) and [versatiles-rs](https://github.com/versatiles-org/versatiles-rs). Early implementation: it opens containers, previews a pipeline live and imports vector, tabular and raster data, but is not yet useful end to end.
- **[Choro](https://github.com/versatiles-org/versatiles-choro)**: A modular, Docker-based workflow for building choropleth maps — maps where regions are coloured according to data values — aimed at newsrooms and data journalists. The API, UI and configuration formats will still change.
- **[Map Animation](https://github.com/versatiles-org/versatiles-map-animation)**: A browser-based editor for composing keyframe camera animations and annotations on a VersaTiles map. Animations are shared as a URL hash, embeddable via `<iframe>`, and can be rendered to MP4 with a Docker image. A prototype: hosted, but not publicly linked.

## Planned

- **Generate City Maps**: An interactive web demo for generating stylised black-and-white city map posters from any region.
- **Style Converter**: A Node.js utility for converting map styles from the OpenMapTiles schema to the Shortbread schema.
