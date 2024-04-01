

git clone sprites
run in sprites: ./bin/build_png.js

git clone styles
run in styles: ./bin/make_styles.js http://localhost:8080/

download + untar frontend
add demo.html

download planet

versatiles serve --fast \
	-s "../versatiles-styles/dist[/assets/styles/]" \
	-s "../versatiles-sprites/dist[/assets/sprites/]" \
	-s ../versatiles-frontend/dist/frontend \
	"planet-20230925.versatiles[osm]"

open http://localhost:8080/demo.html














<!DOCTYPE html>

<html>

<head>
	<meta charset="utf-8" />
	<title>VersaTiles - Demo</title>
	<meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
	<link rel="shortcut icon" sizes="16x16 24x24 32x32 48x48 64x64" href="/favicon.ico">
	<script src="assets/maplibre/maplibre-gl.js"></script>
	<link href="assets/maplibre/maplibre-gl.css" rel="stylesheet" />
	<style>
		body {
			font-family: sans-serif;
			padding: 0;
			margin: 0;
			position: relative;
		}

		#map {
			width: 100vw;
			height: 100vh;
		}
	</style>
</head>

<body>
	<div id="map"></div>
	<script>
		new maplibregl.Map({
			container: 'map',
			style: '/assets/styles/colorful.de.json',
			hash: true,
		});
	</script>
</body>

</html>