# How to run a local VersaTiles server on debian

In this guide, we will explain how to set up and run a local VersaTiles server. We will also discuss how to download the necessary files and start the server with an optional frontend.

> [!NOTE]
> The VersaTiles server is written in Rust (Repo: [versatiles-rs](https://github.com/versatiles-org/versatiles-rs)).


## Step 1: Install the VersaTiles tool

See ["Installing VersaTiles"](install_versatiles.md).

## Step 2: Download the VersaTiles planet

The VersaTiles data file is a compact file containing all map tiles for the entire planet. You can download it with `wget`:

```bash
wget -c https://download.versatiles.org/osm.versatiles
```

If you need only a part of the planet, e.g. only a continent/country/city, you can download this part using the `versatiles` tool. See: [download tiles](download_tiles.md#partial-download)

Once the download is complete, save the `.versatiles` file in a directory of your choice.

## Step 3: Download the optional frontend

The frontend might be helpful because it includes JavaScript libraries, map styles, and fonts. You can download the latest frontend using `wget` by running the following command:

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz"
```

Save the `frontend.br.tar.gz` file in the same directory as the `.versatiles` file.

## Step 3: Start the VersaTiles server

To start the VersaTiles server, open a shell, navigate to the directory where you saved the `.versatiles` file and the frontend file, and run:

```bash
versatiles serve -s frontend.br.tar.gz "[osm]osm.versatiles"
```

The VersaTiles server will now be running locally on your machine. To test it open `http://localhost:8080` in your browser.

For more information, see the documentation on [using the VersaTiles server](https://docs.versatiles.org/basics/versatiles_server#usage).
