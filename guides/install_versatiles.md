# VersaTiles Installation Guide

This guide outlines different ways to install VersaTiles on your system:

- [Using Homebrew (macOS)](#using-homebrew-macos)
- [Using the Install Script (Linux / macOS)](#using-the-install-script-linux--macos)
- [Using PowerShell (Windows)](#using-powershell-windows)
- [NixOS](#nixos)
- [Building with Cargo](#building-with-cargo)
- [Building from Source](#building-from-source)

> [!TIP]
> If you want to setup your own map server, use our "[Setup Tool](https://versatiles.org/tools/setup_server)" to generate the necessary shell code: [versatiles.org/tools/setup_server](https://versatiles.org/tools/setup_server)

## Using Homebrew (macOS)

To install VersaTiles using Homebrew, run the following commands in your terminal:

```sh
brew tap versatiles-org/versatiles
brew trust versatiles-org/versatiles
brew install versatiles
```

To upgrade to the latest version, use:

```sh
brew update
brew upgrade versatiles
```

## Using the Install Script (Linux / macOS)

You can use the install script to download and install the appropriate [precompiled binary](https://github.com/versatiles-org/versatiles-rs/releases/latest) for your system. The script automatically places the binary in `/usr/local/bin/`.

Run the following command:

```sh
curl -Ls "https://github.com/versatiles-org/versatiles-rs/releases/latest/download/install-unix.sh" | sudo sh
```

## Using PowerShell (Windows)

Open PowerShell and run:

```powershell
irm "https://github.com/versatiles-org/versatiles-rs/releases/latest/download/install-windows.ps1" | iex
```

This downloads and installs the latest precompiled Windows binary.

## NixOS

VersaTiles is available in Nixpkgs. Search for it in the [NixOS package index](https://search.nixos.org/packages?show=versatiles) or install directly:

```sh
nix-env -iA nixpkgs.versatiles
```

## Building with Cargo

Ensure that you have [Rust and Cargo installed](https://doc.rust-lang.org/cargo/getting-started/installation.html). Then, install VersaTiles with:

```sh
cargo install versatiles
```

## Building from Source

To manually build VersaTiles from the source code, follow these steps:

```sh
git clone https://github.com/versatiles-org/versatiles-rs.git
cd versatiles-rs
cargo build --bin versatiles --release
cp ./target/release/versatiles /usr/local/bin/
```

## Additional Information

For Docker-based installation and further details, refer to the [Installation section](https://github.com/versatiles-org/versatiles-rs/?tab=readme-ov-file#installation) of the [VersaTiles repository](https://github.com/versatiles-org/versatiles-rs).
