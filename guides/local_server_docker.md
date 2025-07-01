# Run a VersaTiles Server Locally with Docker

This short guide shows how to launch a VersaTiles server on your machine in just a few commands.

> [!TIP]
> To expose the server on a public domain, see **[Deploy a VersaTiles server with Nginx](./deploy_using_docker.md)**.

## Prerequisites

Before you begin, make sure you have [docker](https://www.docker.com/) properly installed.

---

## Option A — Minimal image: `versatiles`

The image **`versatiles`** contains only the [VersaTiles Rust server](https://github.com/versatiles-org/versatiles-rs). Choose it if you already have your own front‑end or want finer control.

```bash
docker run --rm -it \
  -p 8080:8080 \
  --mount type=bind,src="$(pwd)",dst=/data,readonly \
  versatiles/versatiles:latest \
  serve \
  -s /data/frontend-dev.br.tar \
  '/data/osm.versatiles'
```

Open <http://localhost:8080/> in your browser to confirm the server is running.

See the full image documentation in the [`versatiles` directory](https://github.com/versatiles-org/versatiles-docker/blob/main/versatiles/README.md) of the [versatiles-docker repo](https://github.com/versatiles-org/versatiles-docker/).

---

## Option B — Bundled front‑end image: `versatiles-frontend`

The image **`versatiles-frontend`** packages the [VersaTiles server](https://github.com/versatiles-org/versatiles-rs) together with the latest [developer front‑end](https://github.com/versatiles-org/versatiles-frontend). This is the quickest way to spin up a local map viewer.

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

- **Server** — [versatiles-rs](https://github.com/versatiles-org/versatiles-rs)  
- **Dockerfiles** — [versatiles-docker](https://github.com/versatiles-org/versatiles-docker)  
- **Front‑end** — [versatiles-frontend](https://github.com/versatiles-org/versatiles-frontend) · [latest release](https://github.com/versatiles-org/versatiles-frontend/releases/latest/)  
- **Tile data** — <https://download.versatiles.org>
