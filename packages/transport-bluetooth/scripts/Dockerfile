# https://github.com/joseluisq/rust-linux-darwin-builder/blob/master/README.md

FROM joseluisq/rust-linux-darwin-builder:1.75.0

RUN apt-get update && apt-get install -y mingw-w64

WORKDIR /app

COPY ./src ./src
COPY ./Cargo.toml ./Cargo.toml

RUN rustup target add x86_64-pc-windows-gnu && \
  cargo build --target x86_64-pc-windows-gnu --release && \
  mkdir -p /output/win-x64 && \
  cp ./target/x86_64-pc-windows-gnu/release/trezor-bluetooth.exe /output/win-x64/trezor-bluetooth.exe && \
  x86_64-w64-mingw32-strip /output/win-x64/trezor-bluetooth.exe

# RUN cargo build --target aarch64-apple-darwin --release && \
#   mkdir -p /output/mac-arm64 && \
#   cp ./target/aarch64-apple-darwin/release/trezor-bluetooth /output/mac-arm64/trezor-bluetooth && \
#   aarch64-apple-darwin22.4-strip /output/mac-arm64/trezor-bluetooth

RUN cargo build --target x86_64-apple-darwin --release && \
  mkdir -p /output/mac-x64 && \
  cp ./target/x86_64-apple-darwin/release/trezor-bluetooth /output/mac-x64/trezor-bluetooth && \
  x86_64-apple-darwin22.4-strip /output/mac-x64/trezor-bluetooth && \
  # mac arm build doesn't work on mac M1 but x64 works well. investigate more
  mkdir -p /output/mac-arm64 && \
  cp ./target/x86_64-apple-darwin/release/trezor-bluetooth /output/mac-arm64/trezor-bluetooth && \
  x86_64-apple-darwin22.4-strip /output/mac-arm64/trezor-bluetooth

RUN cargo build --target aarch64-unknown-linux-gnu --release && \
  mkdir -p /output/linux-arm64 && \
  cp ./target/aarch64-unknown-linux-gnu/release/trezor-bluetooth /output/linux-arm64/trezor-bluetooth && \
  aarch64-linux-gnu-strip /output/linux-arm64/trezor-bluetooth

RUN cargo build --target x86_64-unknown-linux-gnu --release && \
  mkdir -p /output/linux-x64 && \
  cp ./target/x86_64-unknown-linux-gnu/release/trezor-bluetooth /output/linux-x64/trezor-bluetooth && \
  strip /output/linux-x64/trezor-bluetooth
