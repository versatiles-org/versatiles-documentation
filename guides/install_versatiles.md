You can read this document in [English/영어](install_versatiles.md) or [Korean/한국어](install_versatiles.ko.md).

# VersaTiles Installation Guide

This guide outlines different ways to install VersaTiles on your system:

- [Using Homebrew (macOS)](#using-homebrew-macos)
- [Using the Install Script](#using-the-install-script)
- [Building with Cargo](#building-with-cargo)
- [Building from Source](#building-from-source)

## Using Homebrew (macOS)

To install VersaTiles using Homebrew, run the following commands in your terminal:

```sh
brew tap versatiles-org/versatiles
brew install versatiles
```

To upgrade to the latest version, use:

```sh
brew update
brew upgrade versatiles
```

## Using the Install Script

You can use the install script to download and install the appropriate [precompiled binary](https://github.com/versatiles-org/versatiles-rs/releases/latest) for your system. The script automatically places the binary in `/usr/local/bin/`.

Run the following command:

```sh
curl -Ls "https://github.com/versatiles-org/versatiles-rs/raw/main/scripts/install-unix.sh" | sh
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

For more details, including Docker support and installation on NixOS, refer to the [Installation section](https://github.com/versatiles-org/versatiles-rs/?tab=readme-ov-file#installation) of the [VersaTiles repository](https://github.com/versatiles-org/versatiles-rs).
