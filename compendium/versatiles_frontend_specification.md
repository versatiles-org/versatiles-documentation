- [VersaTiles Frontend Specification](#versatiles-frontend-specification)
	- [Folder Structure](#folder-structure)
	- [Folder: `/assets/`](#folder-assets)
	- [Folder: `/assets/glyphs/`](#folder-assetsglyphs)
	- [File: `/assets/glyphs/index.json`](#file-assetsglyphsindexjson)
	- [File: `/assets/glyphs/font_families.json`](#file-assetsglyphsfont_familiesjson)
	- [Folder: `/assets/sprites/`](#folder-assetssprites)
	- [File: `/assets/sprites/index.json`](#file-assetsspritesindexjson)
	- [Folder: `/tiles/`](#folder-tiles)
	- [Files: `/tiles/{tileset_id}/{z}/{x}/{y}{.ext}`](#files-tilestileset_idzxyext)
	- [File: `/tiles/index.json`](#file-tilesindexjson)


------------------------------------------


# VersaTiles Frontend Specification

Map servers like [Martin](https://github.com/maplibre/martin), [mbtileserver](https://github.com/consbio/mbtileserver), [t-rex](https://github.com/t-rex-tileserver/t-rex), [TileServer GL](https://github.com/maptiler/tileserver-gl) and others have different ways of organizing all files, folders and their URLs in the web frontend.

This can be problematic and confusing. For example it is unclear if a folder `/fonts/` should contain web fonts (like `*.woff`) or glyphs for rendering in WebGL (`*.pbf`). Or if a folder `/styles/` should contain style sheets (`*.css`) or map style definitions (`style.json`).

Based on best practices the VersaTiles Frontend Specification defines a recommended folder structure and file formats for serving static and dynamic files, to avoid confusion and incompatibilities when developing a web frontend.


## Folder Structure

- 📄 **`index.html`**  
  The index.html file serves as the front page of the map server.

- 📂 **`assets/`**  
  [Contains all static resources such as libraries, fonts, sprites, styles, images, ...](#folder-assets)

  - 📂 **`glyphs/`**  
	 [Contains font glyphs used for map text rendering.](#folder-assetsglyphs)

	 - 📂 **`{font_id}/`**  
		Each font face is stored in its own folder, named using a font ID.

		- 📄 **`{start}-{end}.pbf`**  
		  Glyphs for each font are divided into ranges of 256 characters (e.g., `0-255.pbf`), where each file represents a specific Unicode range.

	 - 📄 **`font_families.json`**  
		[Defines all available font families and their font faces (e.g., regular, italic, bold, condensed) along with their properties.](#file-assetsglyphsfont_familiesjson)

	 - 📄 **`index.json`**  
		[A JSON file that lists all available font IDs, essentially providing an index of all the fonts in the `assets/glyphs/` folder.](#file-assetsglyphsindexjson)

  - 📂 **`lib/`**  
	 Contains all JavaScript/CSS libraries.

	 - 📂 **`maplibre-gl/`**  
		Folder for [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), which must contain both `maplibre-gl.js` and `maplibre-gl.css` files for map rendering.

	 - 📂 **`versatiles-style/`**  
		Folder for [VersaTiles Style](https://github.com/versatiles-org/versatiles-style), which contains the `versatiles-style.js` file to generate map styles.

	 - 📂 **`.../`**  
		Optionally, you can include other libraries such as [MapLibre GL Inspect](https://github.com/maplibre/maplibre-gl-inspect), ...

  - 📂 **`sprites/`**  
	 [Contains all map sprites (image files with multiple small graphical icons or symbols used on the map).](#folder-assetssprites)

	 - 📂 **`{sprite_id}/`**  
		Each sprite is stored in its own directory, named using its sprite ID.

		- 📄 **`sprite.json`**  
		  The metadata for the sprite set, defined according to the [sprite source format](https://maplibre.org/maplibre-style-spec/sprite/#sprite-source-format).

		- 📄 **`sprite.png`**  
		  The actual sprite image, which contains all sprite icons in a single PNG image file.

	 - 📄 **`index.json`**  
		[A JSON file listing all available sprite IDs.](#file-assetsspritesindexjson)

  - 📂 **`styles/`**  
	 Contains prepared map styles.

	 - 📄 **`{style_id}/style.json`**  
		Each map style is stored in its own folder. I must contain a `style.json` file following the [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/) to define how the map is rendered. The folder can also contain additional files like style specific sprite definitions.

  - 📂 **`.../`**  
	 Optional subfolders such as `css/`, `fonts/`, `images/`, and `js/` can be included as needed for additional resources.

- 📂 **`tiles/`**
  [The content of this folder is generated and returned by the tile server.](#folder-tiles)

  - 📂 **`{tileset_id}/`**  
	 Each tile set is organized in a separate directory identified by its `{tileset_id}`.

	 - 📄 **`{z}/{x}/{y}{.ext}`**  
		[The individual map tiles are stored in subdirectories based on the zoom level (`{z}`), column (`{x}`), and row (`{y}`). The tile file extension (`{.ext}`) is optional.](#files-tilestileset_idzxyext)

	 - 📄 **`tiles.json`**  
		Metadata for each tile set following the [TileJSON specification](https://github.com/mapbox/tilejson-spec).

  - 📄 **`index.json`**  
	 [JSON with an array of tile set IDs. This file acts as a directory of available tile sets.](#file-tilesindexjson)


## Folder: `/assets/`

The `/assets/` folder is designated for static assets such as JavaScript libraries, CSS files, map styles, images, icons, fonts, and other related resources.


## Folder: `/assets/glyphs/`

- All map glyphs should be stored in the `/assets/glyphs/` directory.
- Glyphs should be served as `/assets/glyphs/{font_id}/{start}-{end}.pbf`. For example: `/assets/glyphs/open_sans_bold_italic/768-1023.pbf`.
- Font IDs (`{font_id}`) should be OS/UNIX/URL safe, using only lowercase letters, digits, and underscores. For example, instead of naming a folder `Arial%20Unicode%20MS%20Regular`, it should be named `arial_unicode_ms_regular`.
- Additionally, you should provide a list of all available fonts in the following files:
  - [`/assets/glyphs/index.json`](#file-assetsglyphsindexjson)
  - [`/assets/glyphs/font_families.json`](#file-assetsglyphsfont_familiesjson)
- The MapLibre Style Spec has [more information about glyphs](https://maplibre.org/maplibre-style-spec/glyphs/).


## File: `/assets/glyphs/index.json`

The `/assets/glyphs/index.json` file should contain a JSON array listing all available `{font_id}`s. These `{font_id}`s correspond to the folder names within `/assets/glyphs/`, where each folder contains the glyphs for that font face. This index file can be used by map design tools to get a list of all fonts.

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


## File: `/assets/glyphs/font_families.json`

The `/assets/glyphs/font_families.json` file should contain a JSON array defining all font families along with their respective font faces. This will allow map design tools to know, which font faces for each font family are available.
Each `FontFace` object's `id` must match the corresponding `{font_id}` in `/assets/glyphs/`.

> [!NOTE]
> The structure of `font_families.json` is based on the concepts of [font families and font faces in CSS 4](https://www.w3.org/TR/css-fonts-4/#font-families).
> The properties `style`, `weight` and `width` and their values are based on the CSS 4 properties [`font-style`](https://www.w3.org/TR/css-fonts-4/#font-style-prop), [`font-weight`](https://www.w3.org/TR/css-fonts-4/#font-weight-numeric-values) and [`font-width`](https://www.w3.org/TR/css-fonts-4/#font-width-prop)

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
		{ "id": "fira_sans_bold_italic",      "style": "italic", "weight": 700, "width": "normal"    },
		{ "id": "fira_sans_bold",             "style": "normal", "weight": 700, "width": "normal"    },
		{ "id": "fira_sans_italic",           "style": "italic", "weight": 400, "width": "normal"    },
		{ "id": "fira_sans_regular",          "style": "normal", "weight": 400, "width": "normal"    },
		{ "id": "fira_sans_cond_bold_italic", "style": "italic", "weight": 700, "width": "condensed" },
		{ "id": "fira_sans_cond_bold",        "style": "normal", "weight": 700, "width": "condensed" },
		{ "id": "fira_sans_cond_italic",      "style": "italic", "weight": 400, "width": "condensed" },
		{ "id": "fira_sans_cond_regular",     "style": "normal", "weight": 400, "width": "condensed" }
	 ]
  }
]
```

Based on this example, the following glyphs must be available:

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


## Folder: `/assets/sprites/`

- All map sprites, that are used by multiple map styles, should be stored in the `/assets/sprites/` directory.
- Each sprite should be contained in its own subdirectory: `/assets/sprites/{sprite_id}/`.
- The metadata for each sprite is defined in JSON format following the [sprite source specification](https://maplibre.org/maplibre-style-spec/sprite/#sprite-source-format) and should be served as `/assets/sprites/{sprite_id}/sprite.json`.
- Sprite IDs (`{sprite_id}`) should be OS/UNIX/URL safe, using only lowercase letters, digits, and underscores.
- Additionally, you should provide a list of all available sprites in the [`/assets/sprites.json`](#file-assetsspritesjson) file.
- Refer to the [MapLibre Style Spec](https://maplibre.org/maplibre-style-spec/sprite/) for more detailed information on sprites.


## File: `/assets/sprites/index.json`

This file should contain a JSON array listing all available `{sprite_id}`s. These `{sprite_id}`s correspond to the folder names within `/assets/sprites/`. This index file can be used by map design tools to get a list of all sprites.

**Example:**

```json
[
  "versatiles",
  "marker",
  "traffic_signs",
  "cabbages"
]
```


## Folder: `/tiles/`

The `/tiles/` folder is used to serve map tiles and related metadata in the [TileJSON format](https://github.com/mapbox/tilejson-spec). All files are generated dynamically by the map server.


## Files: `/tiles/{tileset_id}/{z}/{x}/{y}{.ext}`

- `/tiles/{tileset_id}/`: Each tile set is stored in its own subdirectory identified by `{tileset_id}`.
- `/tiles/{tileset_id}/{z}/{x}/{y}`: The tiles themselves are stored in directories based on zoom level (`{z}`), and within that, further divided by x (column) and y (row) coordinates (`{x}`, `{y}`).
- File extensions `{.ext}` are optional. But if set they should reflect the correct data type of the map tiles like `.png`, `.jpeg` or `.pbf`.

For a tile set with the ID `city_map`, the folder structure for a tile at zoom level 10, coordinates (x: 512, y: 384) would be: `/tiles/city_map/10/512/384`


## File: `/tiles/index.json`

This file contains an array of all available `{tileset_id}`. For every `{tileset_id}` their must be `/tiles/{tileset_id}/tiles.json`. This index file can be used by map design tools to get a list of all available tile sets.

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
