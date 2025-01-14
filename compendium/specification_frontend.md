# VersaTiles Frontend Specification

Map servers like [Martin](https://github.com/maplibre/martin), [mbtileserver](https://github.com/consbio/mbtileserver), [t-rex](https://github.com/t-rex-tileserver/t-rex), [TileServer GL](https://github.com/maptiler/tileserver-gl) and others have different ways of organising their files and folders in the web frontend. The same assets can be served at different URLs depending on the server software.

This can be problematic and confusing. For example, it is unclear whether a `/fonts/` folder should contain web fonts (`*.woff`) or glyphs for Maplibre GL JS (`*.pbf`). Or if a `/styles/` folder should contain style sheets (`*.css`) or map style definitions (`style.json`).

Based on best practices, the VersaTiles Frontend Specification defines a recommended folder structure and file formats for serving static and dynamic files to avoid confusion and incompatibilities when developing a web frontend.


## Folder Structure

<pre>
├── 📂 <a href="#folder-assets">assets/</a>
│   ├── 📂 <a href="#folder-assetsglyphs">glyphs/</a>
│   │   ├── 📂 <a href="#folder-assetsglyphs">{font_id}/</a>
│   │   │   └── 📄 <a href="#folder-assetsglyphs">{start}-{end}.pbf</a>
│   │   ├── 📄 <a href="#file-assetsglyphsfont_familiesjson">font_families.json</a>
│   │   └── 📄 <a href="#file-assetsglyphsindexjson">index.json</a>
│   ├── 📂 lib/
│   │   ├── 📂 maplibre-gl/
│   │   │   ├── 📄 maplibre-gl.css
│   │   │   ├── 📄 maplibre-gl.js
│   │   │   └── ...
│   │   ├── 📂 versatiles-style/
│   │   │   └── 📄 versatiles-style.js
│   │   └── 📂 .../
│   ├── 📂 <a href="#folder-assetssprites">sprites/</a>
│   │   ├── 📂 <a href="#folder-assetssprites">{sprite_id}/</a>
│   │   │   ├── 📄 <a href="#folder-assetssprites">sprite.json</a>
│   │   │   └── 📄 <a href="#folder-assetssprites">sprite.png</a>
│   │   └── 📄 <a href="#file-assetsspritesindexjson">index.json</a>
│   ├── 📂 <a href="#folder-assetsstyles">styles/</a>
│   │   └── 📂 <a href="#folder-assetsstyles">{style_id}/</a>
│   │       └── 📄 <a href="#folder-assetsstyles">style.json</a>
│   └── 📂 .../
├── 📂 <a href="#folder-tiles">tiles/</a>
│   ├── 📂 <a href="#files-tilestileset_idzxyext">{tileset_id}/</a>
│   │   ├── 📂 <a href="#files-tilestileset_idzxyext">{z}/</a>
│   │   │   └── 📂 <a href="#files-tilestileset_idzxyext">{x}/</a>
│   │   │       └── 📄 <a href="#files-tilestileset_idzxyext">{y}{.ext}</a>
│   │   └── 📄 tiles.json
│   └── 📄 <a href="#file-tilesindexjson">index.json</a>
└── 📄 index.html
</pre>

## Folder: `/assets/`

The `/assets/` folder is used for static assets such as JavaScript libraries, CSS files, map styles, images, icons, fonts and other related resources.


### Folder: `/assets/glyphs/`

- All map glyphs should be stored in the `/assets/glyphs/` directory.
- Glyphs should be served as `/assets/glyphs/{font_id}/{start}-{end}.pbf`. For example: `/assets/glyphs/open_sans_bold_italic/768-1023.pbf`.
- Font IDs (`{font_id}`) should be OS/UNIX/URL safe, using only lower case letters, digits and underscores. For example, instead of naming a folder `Arial%20Unicode%20MS%20Regular`, it should be named `arial_unicode_ms_regular`.
- You should also include a list of all available fonts in the following files
  - [`/assets/glyphs/index.json`](#file-assetsglyphsindexjson)
  - [`/assets/glyphs/font_families.json`](#file-assetsglyphsfont_familiesjson)
- The MapLibre Style Spec has [more information about glyphs](https://maplibre.org/maplibre-style-spec/glyphs/).


### File: `/assets/glyphs/index.json`

The `/assets/glyphs/index.json` file should contain a JSON array listing all available `{font_id}`s. These `{font_id}`s correspond to the folder names within `/assets/glyphs/`, with each folder containing the glyphs for that typeface. This index file can be used by map design tools to get a list of all fonts.

**Example:**

```json
[
  "fira_sans_bold",
  "fira_sans_bold_italic",
  "fira_sans_cond_bold",
  "fira_sans_cond_bold_italic",
  "fira_sans_cond_italic",
  "fira_sans_cond_regular",
  "fira_sans_italic",
  "fira_sans_regular"
]
```


### File: `/assets/glyphs/font_families.json`

The `/assets/glyphs/font_families.json` file should contain a JSON array that defines all the font families along with their respective faces. This allows map design tools to know which faces are available for each font family.
The `id` of each `FontFace` object must match the corresponding `{font_id}` in `/assets/glyphs/`.

> [!NOTE]
> The structure of `font_families.json` is based on the concepts of [Font Families and Faces in CSS 4](https://www.w3.org/TR/css-fonts-4/#font-families).
> The `style`, `weight` and `width` properties and their values are based on the CSS 4 [`font-style`](https://www.w3.org/TR/css-fonts-4/#font-style-prop), [`font-weight`](https://www.w3.org/TR/css-fonts-4/#font-weight-numeric-values) and [`font-width`](https://www.w3.org/TR/css-fonts-4/#font-width-prop) properties.

The TypeScript definition for this JSON is as follows:

```typescript
type FontFamilies = FontFamily[];

interface FontFamily {
  name: string;
  faces: FontFace[];
}

interface FontFace {
  id: string;
  style: "normal" | "italic" | "oblique";
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  width:
    "ultra-condensed" | "extra-condensed" | "condensed" | "semi-condensed" |
    "normal" |
    "semi-expanded" | "expanded" | "extra-expanded" | "ultra-expanded"
}
```

**Example:**

```json
[
  {
    "name": "Fira Sans",
    "faces": [
      {"id":"fira_sans_bold_italic",      "style":"italic", "weight":700, "width":"normal"   },
      {"id":"fira_sans_bold",             "style":"normal", "weight":700, "width":"normal"   },
      {"id":"fira_sans_italic",           "style":"italic", "weight":400, "width":"normal"   },
      {"id":"fira_sans_regular",          "style":"normal", "weight":400, "width":"normal"   },
      {"id":"fira_sans_cond_bold_italic", "style":"italic", "weight":700, "width":"condensed"},
      {"id":"fira_sans_cond_bold",        "style":"normal", "weight":700, "width":"condensed"},
      {"id":"fira_sans_cond_italic",      "style":"italic", "weight":400, "width":"condensed"},
      {"id":"fira_sans_cond_regular",     "style":"normal", "weight":400, "width":"condensed"}
    ]
  }
]
```

Based on this example, the following glyphs must be present:

```shell
/assets/glyphs/fira_sans_bold_italic/{range}.pbf
/assets/glyphs/fira_sans_bold/{range}.pbf
/assets/glyphs/fira_sans_cond_bold_italic/{range}.pbf
/assets/glyphs/fira_sans_cond_bold/{range}.pbf
/assets/glyphs/fira_sans_cond_italic/{range}.pbf
/assets/glyphs/fira_sans_cond_regular/{range}.pbf
/assets/glyphs/fira_sans_italic/{range}.pbf
/assets/glyphs/fira_sans_regular/{range}.pbf
```


### Folder: `/assets/sprites/`

- All map sprites that are used by multiple map styles should be stored in the `/assets/sprites/` directory.
- Each sprite should be in its own subdirectory: `/assets/sprites/{sprite_id}/`.
- The metadata for each sprite is defined in JSON format according to the [sprite source specification](https://maplibre.org/maplibre-style-spec/sprite/#sprite-source-format) and should be served as `/assets/sprites/{sprite_id}/sprite.json`.
- Sprite IDs (`{sprite_id}`) should be OS/UNIX/URL safe, using only lower case letters, numbers and underscores.
- You should also provide a list of all available sprites in the [`/assets/sprites/index.json`](#file-assetsspritesindexjson) file.
- See the [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/sprite/) for more detailed information on sprites.


### Folder: `/assets/styles/`

- All prepared map styles should be stored in the `/assets/styles/` directory.
- Each style should be in its own subdirectory: `/assets/styles/{style_id}/`.
- The styles are defined in JSON format according to the [MapLibre style specification](https://maplibre.org/maplibre-style-spec/) and should be served as `/assets/styles/{style_id}/style.json`.
- Additional variants of the style can also be saved in the folder, e.g. localised versions such as `de.json`, `en.json`, `nolabel.json` etc.
- Style IDs (`{style_id}`) should be OS/UNIX/URL safe, using only lower case letters, numbers and underscores.

### File: `/assets/sprites/index.json`

This file should contain a JSON array listing all available `{sprite_id}`s. These `{sprite_id}`s correspond to the folder names within `/assets/sprites/`. This index file can be used by map design tools to get a list of all sprites.

**Example:**

```json
[
  "versatiles",
  "markers",
  "traffic_signs",
  "animals"
]
```


## Folder: `/tiles/`

The `/tiles/` folder is used to provide map tiles and associated metadata (in [TileJSON format](https://github.com/mapbox/tilejson-spec)). All files are dynamically generated by the map server.


### Files: `/tiles/{tileset_id}/{z}/{x}/{y}{.ext}`

- `/tiles/{tileset_id}/`: Each tile set is stored in its own subdirectory identified by `{tileset_id}`.
- `/tiles/{tileset_id}/{z}/{x}/{y}`: The tiles themselves are stored in directories based on zoom level (`{z}`) and within that further divided by x (column) and y (row) coordinates (`{x}`, `{y}`).
- File extensions `{.ext}` are optional. If set, they should reflect the correct data type of the map tiles, such as `.png`, `.jpeg` or `.pbf`.

For a tile set with the ID `city_map`, the folder structure for a tile at zoom level 10, coordinates (x: 512, y: 384) would be `/tiles/city_map/10/512/384`


### File: `/tiles/index.json`

This file contains an array of all available `{tileset_id}`. For each `{tileset_id}` there must be `/tiles/{tileset_id}/tiles.json`. This index file can be used by map design tools to get a list of all available tile sets.

**Example:**

```json
[
  "osm",
  "elevation",
  "hillshade-raster",
  "hillshade-vector",
  "landcover-vector"
]
```
