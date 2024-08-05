# The VersaTiles frontend

The server only provides vector tiles. But you need more to have an interactive web map. You also need:
- A JavaScript library like [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), that will handle loading, drawing and user interactions.
- Styles that define, how the vector tiles should be drawn.
- Fonts and symbols for labels and markers on the map.

To make it easier for you we prepared and bundled everything in a compact package that is ready to use.

## Download the frontend

We release the frontend as a TAR file [here](https://github.com/versatiles-org/versatiles-frontend/releases/latest). The package `frontend.br.tar` contains all the files but pre-compressed with Brotli so that the server can provide the compressed files with minimal CPU load.

To download it just run:
```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
```

## How is it build?

We maintain the frontend in the repo: [versatiles-frontend](https://github.com/versatiles-org/versatiles-frontend). A GitHub workflow triggers the build script. It then bundles:
- the latest version of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)
- styles and sprites from the repo: [versatiles-styles](https://github.com/versatiles-org/versatiles-styles)
- fonts (glyphs) from the repo: [versatiles-fonts](https://github.com/versatiles-org/versatiles-fonts)

To make it even easier we precompressed all files inside the TAR with brotli. That's why the package has the unusual file extension `.br.tar`. Changing the order to `.tar.br` would be wrong because the TAR container itself is not compressed.
