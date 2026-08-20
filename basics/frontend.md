# The VersaTiles frontend

The server only provides vector tiles. But you need more to have an interactive web map. You also need:

- A JavaScript library like [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) to handle loading, drawing and user interactions.
- Styles that define how the vector tiles should be drawn.
- Fonts and symbols for labels and markers on the map.

To make it easier for you, we prepared and bundled everything in a compact, ready-to-use package.

## Download the frontend

We release the frontend as a TAR file on the [releases page](https://github.com/versatiles-org/versatiles-frontend/releases/latest).

Each package uses the unusual `.br.tar` extension inside the filename. This means the individual files _inside_ the TAR are each pre-compressed with Brotli, so the server can stream them with minimal CPU load. The TAR container itself is not compressed (which is why `.tar.br` would be the wrong order).

### Variants

Several variants are available to match different deployment needs:

| Variant                    | Size   | Contents                                                             |
| -------------------------- | ------ | -------------------------------------------------------------------- |
| `frontend.br.tar.gz`       | ~91 MB | All fonts, sprites and libraries — the standard choice               |
| `frontend-dev.br.tar.gz`   | ~91 MB | The same libraries as `frontend`, but with a development-oriented UI |
| `frontend-min.br.tar.gz`   | ~39 MB | Like `frontend`, but Noto Sans only (drops the other font families)  |
| `frontend-blank.br.tar.gz` | ~89 MB | Fonts and sprites only — no JS libraries; bring your own scripts     |
| `frontend-tiny.br.tar.gz`  | ~1 MB  | Bare minimum: MapLibre, one style, sprites, Latin-only Noto Sans     |

Each variant is also published without the inner Brotli compression, as plain `*.tar.gz` — useful if your server cannot serve pre-compressed files. Those are roughly 25 % larger.

To download the standard variant:

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz"
```

## What's included

The bundle contains:

- **[MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)** — the map rendering library
- **Map styles** — six ready-to-use themes: `colorful`, `graybeard`, `eclipse`, `neutrino`, `shadow`, `satellite`
- **Fonts (glyphs)** — ten open-source typefaces prepared as SDF glyphs: Roboto, Open Sans, Noto Sans, Fira Sans, and others
- **Sprites** — icon sets for use with the map styles

## How is it built?

We maintain the frontend in the repo: [versatiles-frontend](https://github.com/versatiles-org/versatiles-frontend). A GitHub workflow triggers the build script. It then bundles:

- the latest version of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)
- styles and sprites from the repo: [versatiles-style](https://github.com/versatiles-org/versatiles-style)
- fonts (glyphs) from the repo: [versatiles-fonts](https://github.com/versatiles-org/versatiles-fonts)
