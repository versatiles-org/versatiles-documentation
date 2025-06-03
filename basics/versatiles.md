Running your own map server can be quite challenging. Not only do you have to store all the data in a huge database and generate map tiles, but you also have to deploy a map server, handle all the network traffic and prepare a frontend with all the necessary JavaScript libraries and assets.

Rather than trying to improve this setup, VersaTiles specifies a much simpler architecture.

## Core idea

VersaTiles is a stack that defines how geo data like OpenStreetMap can be processed and served to create interactive web maps. It specifies some basic architectural choices and provides a standard implementation, while leaving the option of deviating from it open. The architecture is as simple as this:

<p style="text-align:center"><img src="../assets/architecture.svg" style="display:inline-block"></p>

- **MAP TILES** are pre-rendered and stored in a [VersaTiles container](../compendium/specification_container.md). We currently use [tilemaker](https://tilemaker.org/) to generate OpenStreetMap (OSM) vector tiles in the [Shortbread scheme](https://shortbread-tiles.org/). All map tiles are available to download for free from [download.versatiles.org](https://download.versatiles.org/)
- The web **FRONTEND** contains everything needed to render maps. We use [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), prepared [glyphs](https://github.com/versatiles-org/versatiles-fonts), [sprites and styles](https://github.com/versatiles-org/versatiles-style), and have [bundled everything together in a TAR file](https://github.com/versatiles-org/versatiles-frontend), ready to use.
- The **MAP SERVER** serves the frontend and map tiles via HTTP. We have a [powerful Rust implementation](https://github.com/versatiles-org/versatiles-rs) and a [flexible Node.js implementation](https://github.com/versatiles-org/node-versatiles-server), as well as special packages (e.g. for [Google Cloud Run](https://github.com/versatiles-org/node-versatiles-google-cloud)).
- The **OPTIONAL PROXY** covers additional network-related topics such as TLS certificates, caching, load balancing and CORS.

## VersaTiles is open and free

To ensure the [four essential freedoms of Free Software](https://en.wikipedia.org/wiki/The_Free_Software_Definition), we have developed some goals that we try to keep in mind in every decision we make:

### Core ideals

- **Everything should be open**  
  _Every piece of code, script and data should be documented, understandable and reproducible._
- **Minimal licences**  
  _Use MIT and CC0, remove proprietary parts. The only attribution should be to the data source if needed, e.g. "© OpenStreetMap contributors"._
- **Keep it simple**  
  _We focus on core functionality that everyone needs. Less features for special cases. We prefer simple solutions that allow more flexibility. Minimal dependencies._
- **Include everyone**  
  _We don't focus on our use cases or the problems of a particular group. Instead, we build solutions that everyone needs: from beginners to professionals, from amateurs to cooperations. Keep in mind, that the world is big and diverse._
- **Look forward**  
  _Focus on solutions that have a long-term future._

### Contribute to the project

As an open source project, we encourage you to contribute to the VersaTiles project by submitting bug reports, feature requests, or code contributions to [github.com/versatiles-org](https://github.com/versatiles-org)

## Key decisions

### Use vector tiles

Image tiles are great for satellite and aerial photography. But maps, which are essentially vector graphics, are a perfect fit for vector tiles.

### Use containers instead of databases

Databases are powerful and flexible tools for handling large amounts of data. Unfortunately they have some major drawbacks: Importing a lot of data (e.g. OSM planet) is very slow, they take up a lot of disk space, they're hard to set up and maintain, they increase the risk of problems, and it's hard to integrate them into a scalable infrastructure.

### Shortbread instead of OpenMapTiles

The OpenMapTiles schema is "open" but not free, so we removed it. We use and support [Shortbread](https://shortbread-tiles.org) instead.

### Covering use cases from private projects to scalable infrastructures

An infrastructure is perfect, when everyone loves and uses it. That's why we want everyone to be able to use their own map server ... as a hobby project on a Raspberry Pi or as a powerful scalable infrastructure in the cloud.
