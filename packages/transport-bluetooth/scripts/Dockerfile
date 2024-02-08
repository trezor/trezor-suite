# https://github.com/joseluisq/rust-linux-darwin-builder/blob/master/README.md

FROM joseluisq/rust-linux-darwin-builder:1.75.0

RUN apt-get update && apt-get install -y mingw-w64

RUN rustup target add x86_64-pc-windows-gnu

WORKDIR /app

COPY ./src ./src
COPY ./Cargo.toml ./Cargo.toml

RUN cargo build --target x86_64-apple-darwin --release
RUN cargo build --target x86_64-unknown-linux-musl --release
RUN cargo build --target x86_64-pc-windows-gnu --release

RUN mkdir -p /output/macos && cp ./target/x86_64-apple-darwin/release/trezor-bluetooth /output/macos/trezor-bluetooth
RUN mkdir -p /output/linux && cp ./target/x86_64-unknown-linux-musl/release/trezor-bluetooth /output/linux/trezor-bluetooth
RUN mkdir -p /output/windows && cp ./target/x86_64-pc-windows-gnu/release/trezor-bluetooth.exe /output/windows/trezor-bluetooth.exe
