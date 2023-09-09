# How to run a local VersaTiles server on debian

In this guide, we will explain how to set up and run a local VersaTiles server. VersaTiles is a program written in Rust that includes a complete map tile server. We will also discuss how to download the necessary files and start the server with an optional frontend.

## Prerequisites

Before you begin, make sure you have installed the Rust programming language (https://www.rust-lang.org/tools/install)

## Step 1: Download the VersaTiles data file

The VersaTiles data file is a compact file containing all map tiles for the entire planet. You can download it (directly as file or as torrent) from this link:

https://download.versatiles.org/

Once the download is complete, save the .versatiles file in a directory of your choice.

## Step 2: Download the optional frontend

A frontend can be helpful in providing JavaScript, map styles, and fonts for the VersaTiles server. You can download the frontend using `curl` by running the following command:

```
curl -Lo frontend.br.tar "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
```

Save the `frontend.br.tar` file in the same directory as the .versatiles file.

## Step 3: Start the VersaTiles server

To start the VersaTiles server, open a Bash shell or a compatible terminal and navigate to the directory where you saved the .versatiles file and the optional frontend file.

### Start the server without the frontend

To start the server without the frontend, run the following command:

```bash
versatiles serve planet.versatiles
```

### Start the server with the frontend

To start the server with the frontend, run the following command:

```bash
versatiles serve -s frontend.br.tar planet.versatiles
```

The VersaTiles server will now be running locally on your machine. You can access it through your browser by entering the appropriate address and port number (typically, `http://localhost:8080`).
