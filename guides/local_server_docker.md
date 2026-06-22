# Run a VersaTiles Server Locally with Docker

This short guide shows how to launch a VersaTiles server on your machine in just a few commands.

> [!TIP]
> To expose the server on a public domain, see **[Deploy a VersaTiles server with Nginx](./deploy_using_docker.md)**.

## Prerequisites

Before you begin, make sure you have [Docker](https://www.docker.com/) properly installed.

---

## Option A — Minimal image: `versatiles`

The image **`versatiles`** contains only the [VersaTiles Rust server](https://github.com/versatiles-org/versatiles-rs). Choose it if you already have your own frontend or want finer control.

First, download the frontend and tile data into your current directory:

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend-dev.br.tar.gz"
wget -c "https://download.versatiles.org/osm.versatiles"
```

Then start the server (the `-s` flag accepts `.br.tar.gz` directly):

```bash
docker run --rm -it \
  -p 8080:8080 \
  --mount type=bind,src="$(pwd)",dst=/data,readonly \
  versatiles/versatiles:latest \
  serve \
  -s /data/frontend-dev.br.tar.gz \
  '/data/osm.versatiles'
```

Open <http://localhost:8080/> in your browser to confirm the server is running.

See the full image documentation in the [`versatiles` directory](https://github.com/versatiles-org/versatiles-docker/blob/main/versatiles/README.md) of the [versatiles-docker repo](https://github.com/versatiles-org/versatiles-docker/).

---

## Option B — Bundled frontend image: `versatiles-frontend`

The image **`versatiles-frontend`** packages the [VersaTiles server](https://github.com/versatiles-org/versatiles-rs) together with the latest [developer frontend](https://github.com/versatiles-org/versatiles-frontend) already baked in. Only the tile data needs to be on disk:

```bash
wget -c "https://download.versatiles.org/osm.versatiles"
```

```bash
docker run --rm -it \
  -p 8080:8080 \
  --mount type=bind,src="$(pwd)",dst=/tiles,readonly \
  versatiles/versatiles-frontend:latest-alpine \
  -s frontend-dev.br.tar \
  '/tiles/osm.versatiles'
```

Then browse to <http://localhost:8080/>.

See the image documentation in the [`versatiles-frontend` directory](https://github.com/versatiles-org/versatiles-docker/blob/main/versatiles-frontend/README.md) of the [versatiles-docker repo](https://github.com/versatiles-org/versatiles-docker/).

---

## Resources

- **Server** — [versatiles-rs](https://github.com/versatiles-org/versatiles-rs)
- **Dockerfiles** — [versatiles-docker](https://github.com/versatiles-org/versatiles-docker)
- **Frontend** — [versatiles-frontend](https://github.com/versatiles-org/versatiles-frontend) · [latest release](https://github.com/versatiles-org/versatiles-frontend/releases/latest/)
- **Tile data** — <https://download.versatiles.org>
