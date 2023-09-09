# How to run a local VersaTiles server using Docker

In this guide, we will explain how to set up and run a local VersaTiles server using [docker](https://www.docker.com/).
VersaTiles is a program written in Rust that includes a complete map tile server.

## Prerequisites

Before you begin, make sure you have [docker](https://www.docker.com/) properly installed.

## Usage

Start VersaTiles container from latest image including the frontend UI. This will
use the online map resource and no local map file is needed:

    docker run -p 8080:8080 versatiles/versatiles-frontend:latest-alpine \
      versatiles serve -s /frontend.br.tar -i 0.0.0.0 \
     '[osm]https://storage.googleapis.com/versatiles/download/planet/planet-20230605.versatiles'

Open http://localhost:8080/ in your browser and start browsing the world map!

If you want to provide a local cached map file:

    mkdir data
    wget https://storage.googleapis.com/versatiles/download/planet/europe/germany/berlin-20230101.versatiles -O data/berlin-20230101.versatiles
    docker run -p 8080:8080 -v $(pwd)/data/:/data versatiles/versatiles-frontend:latest-alpine \
      versatiles serve -s /frontend.br.tar -i 0.0.0.0 /data/berlin-20230101.versatiles

Until [zoom to bbox in overview mode](https://github.com/versatiles-org/versatiles-frontend/issues/7) is fixed you need to specific the coordinates of the map in the URL, in this case
open http://localhost:8080/map.html?url=/tiles/berlin-20230101/#9.48/52.5024/13.3249 in your browser.
