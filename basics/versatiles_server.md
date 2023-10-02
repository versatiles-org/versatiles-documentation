# How does the VersaTiles server work?

The VersaTiles server is built in Rust and provides excellent performance with low resource usage. In this article, we'll look at the main components and functionality of the VersaTiles server.

# File Format

One of the core concepts of VersaTiles is the unique [.versatiles file format](https://github.com/versatiles-org/versatiles-spec) for storing map data. This format not only contains all the map tiles for the entire planet, but also has an index of all the map tiles with their respective byte offset and length within the file.

The real magic of the .versatiles format is that it doesn't need to be stored locally. Instead, it can be accessed remotely using HTTP, for example. This is possible thanks to HTTP byte range requests, which allow the VersaTiles server to retrieve specific parts of the .versatiles file that contain the required map tile data. By using this feature, the VersaTiles server can efficiently serve map tiles without having the entire .versatiles file locally. This makes building scalable map infrastructures with VersaTiles much easier.

The idea to develop a container that can be accessed via HTTP byte range request is based on [COMTiles](https://github.com/mactrem/com-tiles) and [PMTiles](https://github.com/protomaps/PMTiles). However, since we have a slightly different focus and saw the need to deviate from the previous implementations if necessary, we decided to develop our own standard. However, we are very open to supporting COMTiles and PMTiles as alternatives in our pipeline.

# Installation and setup

First you need to install VersaTiles. See the instructions in the documentation: [Installing VersaTiles](../guides/install_versatiles.md).

You will also need our prepared map tiles. You can find more information on this in the instructions: [Downloading map tiles](../guides/download_tiles.md).

# Usage

You can then start the server by using `versatiles` with the subcommand `server` and then simply adding the versatiles file as argument:
```bash
versatiles server planet.versatiles
```

## Multiple sources

If you want to serve more than one source, you can easily add them:
```bash
versatiles server planet.versatiles satellite_imagery.mbtiles my_overlay.tar
```

When the server is started, all sources and their URL are listed:
```
   /tiles/planet/*                 <-  /tiles/planet.versatiles
   /tiles/satellite_imagery/*      <-  /tiles/satellite_imagery.mbtiles
   /tiles/my_overlay/*             <-  /tiles/my_overlay.tar
```

Each source gets an URL based on the file name (without extension). If you want to use a different URL, you can use this special notation with square brackets:
```bash
versatiles server "[osm]planet.versatiles" "[satellite]satellite_imagery.mbtiles" "[heatmap]my_overlay.tar"
```

Now the URLs look like this:
```
   /tiles/osm/*                    <-  /tiles/planet.versatiles
   /tiles/satellite/*              <-  /tiles/satellite_imagery.mbtiles
   /tiles/heatmap/*                <-  /tiles/my_overlay.tar
```

## Optional frontend

You can extend the VersaTiles server with an optional frontend. This frontend includes the latest version of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), map styles, fonts and symbols. You can [download the frontend](../basics/frontend.md#download-the-frontend):
```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
```

You can then add the frontend to the server by adding the tar file with a `-s` argument:

```bash
versatiles server -s frontend.br.tar planet.versatiles
```

## Different IP/Port

Per default versatiles uses 127.0.0.1:8080. If you want to change IP/Port use the options:
- `-i`/`--ip`: e.g. `-i 0.0.0.0`
- `-p`/`--port`: e.g. `-p 3000`

# What's not included?

The VersaTiles server implements only core functionality to keep the project simple and easy to maintain. TLS certificates and caching are not included. But you can use a CDN or nginx for this. You can find HowTos on CDNs and nginx in the [documentation](https://github.com/versatiles-org/versatiles-documentation).

# Scalability and performance

Rust, the programming language used to develop the VersaTiles server, is known for its performance and low resource consumption. As a result, the VersaTiles server can handle a large number of concurrent requests while maintaining fast response times. This makes it ideal for applications ranging from small projects to large, data-intensive infrastructures.

# Configuration Options

*Please describe configuration options*

# API Documentation

*Please describe the API*

# Customise the front-end

*describe the frontend*

# Updates and migration

*Please add something useful here*
