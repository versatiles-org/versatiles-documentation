Using free map tiles is quite difficult. You have to generate tiles, prepare them for the server, deploy a server, handle the network and add a frontend. VersaTiles is not trying to fix just one problem, but the whole chain at once.

## Core idea

VersaTiles is a stack that defines how OpenStreetMap data can be processed and served to create interactive web maps.

<img src="../assets/stack.svg">

It specifies some basic architectural choices and provides a standard implementation, while leaving open the possibility to deviate from it.

- The **Generator** uses the latest OSM dump to generate vector tiles. We are using [tilemaker](https://tilemaker.org/) to generate vector tiles in [shortbread scheme](https://shortbread.geofabrik.de/schema/).
- The **Converter** prepares these tiles for the server by pre-compressing, cleaning and converting them into a [versatiles container](http://github.com/versatiles-org/versatiles-spec).
- The **Server** serves the vector tiles via HTTP.
- The **Proxy** handles network stuff like TLS certificates, caching, load balancing, CORS etc.
- The **Frontend** loads and renders the vector tiles. We recommend [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/).

## Versatiles is open and free

To ensure the [four essential freedoms of Free Software](https://en.wikipedia.org/wiki/The_Free_Software_Definition), we have developed some goals that we try to keep in mind in every decision we make:

### Core ideals

- **Everything should be open**  
 *Every piece of code, script and data should be documented, understandable and reproducible.*
- **Minimal licences**  
  *Use MIT and CC0, remove proprietary parts. The only attribution should be to the data source: "© OpenStreetMap contributors".*
- **Keep it simple**  
  *Focus on core functionality that everyone needs. Less features for special cases. Prefer simple solutions that allow more flexibility. Minimal dependencies.*
- **Include everyone**  
  *Don't focus on your problems or the problems of a particular group. Instead, build solutions that everyone needs: from beginners to professionals, from hobbyists to cooperations.*
- **Look forward**  
  *Focus on solutions that have a long-term future.*

### Contribute to the project

As an open source project, we encourage you to contribute to the VersaTiles project by submitting bug reports, feature requests, or code contributions to [github.com/versatiles-org](https://github.com/versatiles-org)

## Key decisions

### Use vector tiles

Image tiles are great for satellite and aerial photography. But maps, which are essentially vector graphics, are a perfect fit for vector tiles.

### Use containers instead of databases

Databases are powerful and flexible tools for handling large amounts of data. Unfortunately they have some major drawbacks: Importing a lot of data (e.g. OSM planet) is very slow, they take up a lot of disk space, they're hard to set up and maintain, they're a security risk, and it's hard to integrate them into a scalable infrastructure.

VersaTiles uses it's own container format. Think of it as a single file database that can only handle map tiles.

### Shortbread instead of OpenMapTiles

The OpenMapTiles schema is "open" but not free, so we removed it. We use and support [Shortbread](https://shortbread.geofabrik.de/) instead.

### Covering use cases from private projects to scalable infrastructures

An infrastructure is perfect, when everyone loves and uses it. That's why we want everyone to be able to use their own map server ... as a hobby project on a Raspberry Pi or as a powerful scalable infrastructure in the cloud.
