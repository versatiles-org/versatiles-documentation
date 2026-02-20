```bash
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
	"[osm]osm.versatiles"

open http://localhost:8080/demo.html
```
