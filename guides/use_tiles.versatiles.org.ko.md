# 공개된 타일 서버 사용하기

저희는 [tiles.versatiles.org](https://tiles.versatiles.org)에서 공개된 무료 벡터 타일 서버를 운영합니다.

`https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}` URL 패턴으로 타일에 직접 액세스할 수 있습니다.

타일, 글꼴, 아이콘에 대한 모든 URL이 포함되어 있는 사전 빌드된 스타일 중 하나를 사용할 수도 있습니다: [VersaTiles Style](https://github.com/versatiles-org/versatiles-style/releases/latest/)

아래는 인터랙티브 맵을 위한 오픈소스 라이브러리인 Maplibre를 사용하여 맵을 구현하는 방법을 보여주는 HTML 예제입니다.
```html
<!DOCTYPE html>
<html>
<head>
  <title>Versatiles: Demo Page</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <link href="https://tiles.versatiles.org/assets/maplibre-gl/maplibre-gl.css" rel="stylesheet" />
  <link href="https://tiles.versatiles.org/assets/mapdesigner/mapdesigner-control.css" rel="stylesheet" />

  <script src="https://tiles.versatiles.org/assets/maplibre-gl/maplibre-gl.js"></script>
  <script src="https://tiles.versatiles.org/assets/mapdesigner/mapdesigner-control.js"></script>
  <script src="https://tiles.versatiles.org/assets/styles/versatiles-style.js"></script>
</head>

<body>
  <div id="map" style="position: absolute;top: 0;bottom: 0;width: 100%;"></div>
  <script>
    const map = new maplibregl.Map({
      container: 'map',
      center: [127.105705, 37.513672],
      zoom: 10
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new MapDesignerControl({
      tiles: ['https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}'],
      sprite: 'https://tiles.versatiles.org/assets/sprites/sprites',
      glyphs: 'https://tiles.versatiles.org/assets/fonts/{fontstack}/{range}.pbf',
    }));
  </script>
</body>
</html>
```
