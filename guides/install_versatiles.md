# VersaTiles Installation Guide

This guide outlines various methods to install VersaTiles on your system:

  - Using a Package Manager
    - [Homebrew for MacOS](#homebrew-for-macos)
  - [Downloading the Released Binary](#downloading-the-binary)
  - [Building from Source using Rust and Cargo](#building-from-source)

## Homebrew for MacOS

To install VersaTiles using Homebrew, execute the following commands in your terminal:

```bash
brew tap versatiles-org/versatiles
brew install versatiles
```

If you want to upgrade to the newest version of versatiles, run:

```bash
brew update
brew upgrade versatiles
```

## Downloading the binary

For every new release, we provide pre-compiled binaries for various operating systems and architectures. You can download the latest binary from the following link:

[Latest Release on GitHub](https://github.com/versatiles-org/versatiles-rs/releases/latest)

## Building from source

To build VersaTiles from source, you'll need to have Rust and Cargo installed on your system. If you don't have them, you can install them [here](https://www.rust-lang.org/tools/install).

After installing Rust and Cargo, run the following command:

```bash
cargo install versatiles --all-features
```
