# The VersaTiles frontend

The server only provides vector tiles. But you need more to have an interactive web map. You also need:

- A JavaScript library like [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) to handle loading, drawing and user interactions.
- Styles that define how the vector tiles should be drawn.
- Fonts and symbols for labels and markers on the map.

To make it easier for you, we prepared and bundled everything in a compact, ready-to-use package.

## Download the frontend

We release the frontend as a TAR file on the [releases page](https://github.com/versatiles-org/versatiles-frontend/releases/latest).

The package is named `frontend.br.tar.gz` — note the unusual `.br.tar` extension. This means the individual files *inside* the TAR are each pre-compressed with Brotli, so the server can stream them with minimal CPU load. The TAR container itself is not compressed (which is why `.tar.br` would be the wrong order).

To download it:

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz"
```

## How is it built?

We maintain the frontend in the repo: [versatiles-frontend](https://github.com/versatiles-org/versatiles-frontend). A GitHub workflow triggers the build script. It then bundles:

- the latest version of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)
- styles and sprites from the repo: [versatiles-style](https://github.com/versatiles-org/versatiles-style)
- fonts (glyphs) from the repo: [versatiles-fonts](https://github.com/versatiles-org/versatiles-fonts)
