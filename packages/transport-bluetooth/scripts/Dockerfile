# https://github.com/joseluisq/rust-linux-darwin-builder/blob/master/README.md

FROM joseluisq/rust-linux-darwin-builder:1.85.1

RUN apt-get update && apt-get install -y mingw-w64 curl ca-certificates

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && corepack enable

WORKDIR /app

COPY ./src ./src
COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock
COPY ./build.rs ./build.rs

# Build for Windows x64
RUN rustup target add x86_64-pc-windows-gnu && \
  cargo build --target x86_64-pc-windows-gnu --release --bins && \
  mkdir -p /output/win-x64 && \
  cp ./target/x86_64-pc-windows-gnu/release/trezor-bluetooth.exe /output/win-x64/trezor-bluetooth.exe && \
  x86_64-w64-mingw32-strip /output/win-x64/trezor-bluetooth.exe

# Build for Linux ARM64
RUN cargo build --target aarch64-unknown-linux-gnu --release --bins && \
  mkdir -p /output/linux-arm64 && \
  cp ./target/aarch64-unknown-linux-gnu/release/trezor-bluetooth /output/linux-arm64/trezor-bluetooth && \
  aarch64-linux-gnu-strip /output/linux-arm64/trezor-bluetooth

# Build for Linux x64
RUN cargo build --target x86_64-unknown-linux-gnu --release --bins && \
  mkdir -p /output/linux-x64 && \
  cp ./target/x86_64-unknown-linux-gnu/release/trezor-bluetooth /output/linux-x64/trezor-bluetooth && \
  strip /output/linux-x64/trezor-bluetooth

# Build NAPI for macOS (ARM64 and x64)
COPY ./package.json ./package.json
RUN yarn global add @napi-rs/cli && yarn build:napi
