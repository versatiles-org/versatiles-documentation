# How to use tiles.versatiles.org?

We run a free vector tiles server open for public use at: [tiles.versatiles.org](https://tiles.versatiles.org).

You can access tiles directly via the following URL pattern: `https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}`.

You can also use one of our pre-built styles that already includes all the urls to tiles, fonts and icons: [github.com/versatiles-org/versatiles-style/releases/latest](https://github.com/versatiles-org/versatiles-style/releases/latest/)

Below is a minimal HTML example demonstrating how to implement a map using Maplibre, a popular open-source library for interactive maps.

```html
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8" />
   <title>VersaTiles - Demo</title>
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   <script src="https://tiles.versatiles.org/assets/maplibre/maplibre-gl.js"></script>
   <link href="https://tiles.versatiles.org/assets/maplibre/maplibre-gl.css" rel="stylesheet" />
</head>
<body>
   <div id="map" style="width: 100%; height: 80vh;"></div>
   <script>
      new maplibregl.Map({
         container: 'map', // The container ID
         style: 'https://tiles.versatiles.org/assets/styles/colorful.de.json' // Style URL
      });
   </script>
</body>
</html>
```
