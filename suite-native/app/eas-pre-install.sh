#!/bin/bash


# Check if rustup is installed
if ! command -v rustup &> /dev/null; then
    echo "Rustup not found, installing..."
    # Install rustup in non-interactive mode (-y)
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
    # Source the environment to make rustup available in the current shell
    # shellcheck source=/dev/null
    source "$HOME/.cargo/env"
else
    echo "Rustup is already installed."
fi

sudo ln -sf "$HOME/.cargo/bin/rustup" /usr/local/bin/rustup
sudo ln -sf "$HOME/.cargo/bin/cargo" /usr/local/bin/cargo
sudo ln -sf "$HOME/.cargo/bin/rustc" /usr/local/bin/rustc

# Add required Rust targets for @emurgo/csl-mobile-bridge support
# https://github.com/Emurgo/csl-mobile-bridge?tab=readme-ov-file#requirements
echo "Adding Rust targets..."
rustup target add \
    aarch64-linux-android \
    armv7-linux-androideabi \
    i686-linux-android \
    x86_64-linux-android \
    aarch64-apple-ios \
    aarch64-apple-ios-sim \
    x86_64-apple-ios

echo "Rust environment setup complete."

# Check Python version
echo "Checking Python 3 version..."
python3 --version || { echo "Python 3 is missing!"; exit 1; }

