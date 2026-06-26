# Contributing

Thanks for your interest in VersaTiles! This repository hosts the documentation and the [Showcases](showcases) gallery. Code for the various components lives in [other repositories under versatiles-org](https://github.com/versatiles-org).

The contributions most useful to us, in order:

## Add your project to Showcases

If you use VersaTiles in a public project, we'd love to feature it.

1. Open [`showcases/showcases.yaml`](showcases/showcases.yaml) and append a new entry:

   ```yaml
   - title: 'Your Project'
     url: 'https://example.org'
     source: 'Your Org'
     country: 'Germany'
     category: 'commercial' # or: journalism,independent, research, events
     description: 'One sentence about what the project shows'
     image: your-project-slug.png  # also accepts .jpg, .jpeg, .webp
     tags:
       - interactive-map
       # - any other tags already used by other entries
   ```

2. Drop a screenshot at `showcases/your-project-slug.png` (PNG, 16:9, < 1 MB, it's auto-resized to 800×450 during build).

3. Open a pull request.

That's it — no code changes needed.

## Fix or improve the docs

- **Typos and small fixes:** the easiest path is the **"Edit this page on GitHub"** link in the footer of every page on [docs.versatiles.org](https://docs.versatiles.org). It opens GitHub's web editor scoped to the right file.
- **Larger changes:** clone the repo and preview locally before opening a PR:
  ```bash
  npm install
  npm run dev
  ```
  This starts the VitePress dev server with hot reload at `http://localhost:5173`.

## Report a bug or request a feature

- **Issues with documentation content** — open an issue in [this repository](https://github.com/versatiles-org/versatiles-documentation/issues).
- **Issues with VersaTiles itself** — pick the right component repository under [github.com/versatiles-org](https://github.com/versatiles-org). The most active ones:
  - [`versatiles-rs`](https://github.com/versatiles-org/versatiles-rs) — Rust server and tooling
  - [`versatiles-frontend`](https://github.com/versatiles-org/versatiles-frontend) — prebuilt frontend bundle
  - [`versatiles-style`](https://github.com/versatiles-org/versatiles-style) — map styles and sprites
  - [`versatiles-docker`](https://github.com/versatiles-org/versatiles-docker) — Docker images including OSM tile generation
- **Not sure where it belongs?** Open it anywhere — we'll move it.

## Get in touch

Drop in on [#versatiles:matrix.org](https://matrix.to/#/#versatiles:matrix.org) for questions, ideas or design discussions.
