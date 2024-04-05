# How to run a local VersaTiles server using Docker

In this guide, we will explain how to set up and run a local VersaTiles server using [docker](https://www.docker.com/).

> [!NOTE]
> The VersaTiles server is written in Rust (Repo: [versatiles-rs](https://github.com/versatiles-org/versatiles-rs)).
> The docker containers are specified in the repo [versatiles-docker](https://github.com/versatiles-org/versatiles-docker/tree/main/docker)

## Prerequisites

Before you begin, make sure you have [docker](https://www.docker.com/) properly installed.

You also need to [download the tiles](download_tiles.md).

## Usage

Start the VersaTiles container with the latest image including the front-end user interface by executing the following command in the same folder where the file `*.versatiles` is located:

```bash
docker run -p 8080:8080 --mount src="$(pwd)",dst=/tiles,type=bind,readonly versatiles/versatiles-frontend:latest-alpine \
versatiles serve -i "0.0.0.0" -s frontend.br.tar '[osm]/tiles/osm.versatiles'
```

Open `http://localhost:8080/` in your browser. It should look like this: [Screenshot of the frontend](../assets/screenshots/frontend_index.png)

## Explanation

The Docker command example above contains quite a bit of information, so we should break it down:
- **`docker run`** starts the Docker container.
- **`-p 8080:8080`** maps the port 8080 inside of the container to the outside.
- **`--mount src="$(pwd)",dst=/tiles,type=bind,readonly`** mounts you current directory to `/tiles` inside of the container.
- **`versatiles/versatiles-frontend:latest-alpine`** is the name of the Docker image. You can also choose [one of the other images](https://github.com/versatiles-org/versatiles-docker#images-versatiles-frontend).

Now we have configured docker run. The following arguments are for the VersaTiles server inside:
- **`versatiles server`** run versatiles in server mode.
- **`-i "0.0.0.0"`** listen on all networks.
- **`-s frontend.br.tar`** adds the included [frontend](https://github.com/versatiles-org/versatiles-frontend).
- **`'[osm]/tiles/osm.versatiles'`** use the mounted `*.versatiles` file. Change this if your file has a different name.

For more information, see the documentation on [using the VersaTiles server](https://github.com/versatiles-org/versatiles-documentation/blob/main/basics/versatiles_server.md#usage).
