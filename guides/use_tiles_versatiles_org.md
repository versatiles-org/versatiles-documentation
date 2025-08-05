You can read this document in [English/영어](use_tiles_versatiles_org.md) or [Korean/한국어](use_tiles_versatiles_org.ko.md).

# How to use tiles.versatiles.org

We run a free vector tiles server open for public use at: [tiles.versatiles.org](https://tiles.versatiles.org).

You can access tiles directly via the following URL pattern: `https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}`.

You can also use one of our pre-built styles, which include all necessary URLs for tiles, fonts, and icons: [github.com/versatiles-org/versatiles-style/releases/latest](https://github.com/versatiles-org/versatiles-style/releases/latest/)

Below is a minimal HTML example showing how to implement a map using MapLibre GL JS, a popular open-source library for interactive maps:

```html
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8" />
   <title>VersaTiles - Demo</title>
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   <script src="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.js"></script>
   <link href="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.css" rel="stylesheet" />
</head>
<body>
   <div id="map" style="width: 100%; height: 80vh;"></div>
   <script>
      new maplibregl.Map({
         container: 'map', // The container ID
         style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json' // Style URL
      });
   </script>
</body>
</html>
```

> [!WARNING]
> We regularly update all frontend libraries, including MapLibre GL JS, plugins and styles, to the latest versions to ensure optimal performance and incorporate bug fixes. However, this may include major version updates with breaking changes.
> If your project depends on the assets hosted at tiles.versatiles.org, please be aware that these assets may change. To maintain full control, we recommend bundling the necessary libraries and styles directly into your project.
