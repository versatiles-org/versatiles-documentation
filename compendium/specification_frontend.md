# VersaTiles Frontend Specification

Map servers like [Martin](https://github.com/maplibre/martin), [mbtileserver](https://github.com/consbio/mbtileserver), [t-rex](https://github.com/t-rex-tileserver/t-rex), [TileServer GL](https://github.com/maptiler/tileserver-gl) and others have different ways of organising all the files, folders and their URLs in the web frontend.

This can be problematic and confusing. For example, it is unclear whether a `/fonts/` folder should contain web fonts (`*.woff`) or glyphs for rendering in WebGL (`*.pbf`). Or if a `/styles/` folder should contain style sheets (`*.css`) or map style definitions (`style.json`).

Based on best practices, the VersaTiles Frontend Specification defines a recommended folder structure and file formats for serving static and dynamic files to avoid confusion and incompatibilities when developing a web frontend.


## Folder Structure

- 📄 **`index.html`**  
  The index.html file is the front page of the map server.

- 📂 **`assets/`**  
  [Contains all static resources such as libraries, fonts, sprites, styles, images, ...](#folder-assets)

  - 📂 **`glyphs/`**  
   [Contains font glyphs used for map text rendering](#folder-assetsglyphs)

   - 📂 **`{font_id}/`**  
    Each font face is stored in its own folder, named by its font ID.

    - 📄 **`{start}-{end}.pbf`**  
      The glyphs for each font are divided into ranges of 256 characters (e.g. `0-255.pbf`), with each file representing a particular Unicode range.

   - 📄 **`font_families.json`**  
    [Defines all available font families and their font faces (e.g. regular, italic, bold, condensed) along with their properties.](#file-assetsglyphsfont_familiesjson)

   - 📄 **`index.json`**  
    [A JSON file that lists all available font IDs, essentially providing an index of all the fonts in the `assets/glyphs/` folder.](#file-assetsglyphsindexjson)

  - 📂 **`lib/`**  
   Contains all the JavaScript/CSS libraries.

   - 📂 **`maplibre-gl/`**  
    Folder for [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), which must contain both `maplibre-gl.js` and `maplibre-gl.css` files for map rendering.

   - 📂 **`versatiles-style/`**  
    Folder for [VersaTiles Style](https://github.com/versatiles-org/versatiles-style), which contains the `versatiles-style.js` file to generate map styles.

   - 📂 **`.../`**  
    Optionally you can include other libraries like [MapLibre GL Inspect](https://github.com/maplibre/maplibre-gl-inspect), ...

  - 📂 **`sprites/`**  
   [Contains all map sprites (image files with multiple small graphical icons or symbols used on the map)](#folder-assetssprites)

   - 📂 **`{sprite_id}/`**  
    Each sprite is stored in its own directory, named by its sprite ID.

    - 📄 **`sprite.json`**  
      The metadata for the sprite set, defined according to the [Sprite Source Format](https://maplibre.org/maplibre-style-spec/sprite/#sprite-source-format).

    - 📄 **`sprite.png`**  
      The actual sprite image, containing all the sprite icons in a single PNG image file.

   - 📄 **`index.json`**  
    [A JSON file listing all available sprite IDs.](#file-assetsspritesindexjson)

  - 📂 **`styles/`**  
   Contains prepared map styles.

   - 📄 **`{style_id}/style.json`**  
    Each map style is stored in a separate folder. It must contain a `style.json` file following the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/) to define how the map is rendered. The folder may also contain additional files such as style-specific sprite definitions.

  - 📂 **`.../`**  
   Optional subfolders such as `css/`, `fonts/`, `images/` and `js/` can be included as needed for additional resources.

- 📂 **`tiles/`**
  [The contents of this folder are generated and returned by the tile server.](#folder-tiles)

  - 📂 **`{tileset_id}/`**  
   Each tile set is organised in a separate folder identified by its `{tileset_id}`.

   - 📄 **`{z}/{x}/{y}{.ext}`**  
    [The individual map tiles are stored in subdirectories based on zoom level (`{z}`), column (`{x}`) and row (`{y}`). The tile file extension (`{.ext}`) is optional.](#files-tilestileset_idzxyext)

   - 📄 **`tiles.json`**  
    Metadata for each tile set following the [TileJSON specification](https://github.com/mapbox/tilejson-spec).

  - 📄 **`index.json`**  
   [JSON containing an array of tile set IDs. This file acts as a directory of available tile sets.](#file-tilesindexjson)


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
/assets/glyphs/fira_sans_bold/{range}.pbf
/assets/glyphs/fira_sans_bold_italic/{range}.pbf
/assets/glyphs/fira_sans_italic/{range}.pbf
/assets/glyphs/fira_sans_regular/{range}.pbf
/assets/glyphs/fira_sans_cond_bold/{range}.pbf
/assets/glyphs/fira_sans_cond_bold_italic/{range}.pbf
/assets/glyphs/fira_sans_cond_italic/{range}.pbf
/assets/glyphs/fira_sans_cond_regular/{range}.pbf
```


### Folder: `/assets/sprites/`

- All map sprites used by multiple map styles should be stored in the `/assets/sprites/` directory.
- Each sprite should be in its own subdirectory: `/assets/sprites/{sprite_id}/`.
- The metadata for each sprite is defined in JSON format according to the [sprite source specification](https://maplibre.org/maplibre-style-spec/sprite/#sprite-source-format) and should be served as `/assets/sprites/{sprite_id}/sprite.json`.
- Sprite IDs (`{sprite_id}`) should be OS/UNIX/URL safe, using only lower case letters, numbers and underscores.
- In addition, you should provide a list of all available sprites in the [`/assets/sprites/index.json`](#file-assetsspritesindexjson) file.
- See the [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/sprite/) for more detailed information on sprites.


### File: `/assets/sprites/index.json`

This file should contain a JSON array listing all available `{sprite_id}`s. These `{sprite_id}`s correspond to the folder names within `/assets/sprites/`. This index file can be used by map design tools to get a list of all sprites.

**Example:**

```json
[
  "versatiles",
  "markers",
  "traffic_signs",
  "cabbages"
]
```


## Folder: `/tiles/`

The `/tiles/` folder is used to provide map tiles and associated metadata in [TileJSON format](https://github.com/mapbox/tilejson-spec). All files are dynamically generated by the map server.


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
