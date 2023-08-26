# How does the VersaTiles server work?

The VersaTiles server is built using Rust and provides excellent performance with low resource usage. In this article, we'll look at the main components and functionality of the VersaTiles server.

## File Format

One of the core concepts of VersaTiles is the unique .versatiles file format for storing map data. This format not only contains all the map tiles for the entire planet, but also has an index of all the map tiles with their respective byte offset and length within the file.

The real magic of the .versatiles format is that it doesn't need to be stored locally. Instead, it can be accessed remotely using HTTP, for example. This is possible thanks to HTTP byte range requests, which allow the VersaTiles server to retrieve specific parts of the .versatiles file that contain the required map tile data. By using this feature, the VersaTiles server can efficiently serve map tiles without having the entire .versatiles file locally. This makes building scalable map infrastructures with VersaTiles much easier.

## Installation and setup

You will need Rust and OpenSSL. You can install VersaTiles including the server using `cargo':
```bash
cargo install versatiles
```

Detailed installation and setup instructions for various operating systems can be found in the [documentation](https://github.com/versatiles-org/versatiles-documentation).

You can start the server by simply adding versatiles files as arguments:
```bash
versatiles server planet.versatiles
```

## Optional frontend

You can extend the VersaTiles server with an optional [frontend](https://github.com/versatiles-org/versatiles-frontend). This frontend includes the latest version of [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), some map styles, fonts and symbols.

You can add the frontend by adding the tar file with a `-s` argument:

```bash
versatiles server -s frontend.br.tar planet.versatiles
```

## What's not included?

The VersaTiles server implements only core functionality to keep the project simple and easy to maintain. TLS certificates and caching are not included. But you can use a CDN or nginx for this. You can find HowTos on CDNs and nginx in the [documentation](https://github.com/versatiles-org/versatiles-documentation).

## Scalability and performance

Rust, the programming language used to develop the VersaTiles server, is known for its performance and low resource consumption. As a result, the VersaTiles server can handle a large number of concurrent requests while maintaining fast response times. This makes it ideal for applications ranging from small projects to large, data-intensive infrastructures.

## Configuration Options

*Please describe configuration options*

## API Documentation

*Please describe the API*

## Customise the front-end

*describe the frontend*

## Updates and migration

*Please add something useful here*

## Contribute to the project

As an open source project, we encourage you to contribute to the VersaTiles project by submitting bug reports, feature requests, or code contributions: [github.com/versatiles-org](https://github.com/versatiles-org)
