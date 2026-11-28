# Ethereum Blockbook for the e2e tests that index a local Anvil fork (suite/e2e/support/anvilBlockbook.ts).
# The Blockbook in trezor-user-env-regtest (0.4.0) predates the post-Shanghai block header fields, so it
# computes wrong hashes for blocks Anvil mines and never indexes one. Build steps follow Blockbook's own
# build/docker/bin/Dockerfile at the pinned tag.
FROM debian:bookworm-slim AS build
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential ca-certificates git wget pkg-config \
        libzmq3-dev libgflags-dev libsnappy-dev zlib1g-dev libbz2-dev libzstd-dev liblz4-dev && \
    rm -rf /var/lib/apt/lists/*

ARG GOLANG_VERSION=go1.25.4
ARG TARGETARCH
RUN case "$TARGETARCH" in \
        arm64) GO_SHA256=a68e86d4b72c2c2fecf7dfed667680b6c2a071221bbdb6913cf83ce3f80d9ff0 ;; \
        *) TARGETARCH=amd64; GO_SHA256=9fa5ffeda4170de60f67f3aa0f824e426421ba724c21e133c1e35d6159ca1bec ;; \
    esac && \
    cd /opt && wget -q https://dl.google.com/go/$GOLANG_VERSION.linux-$TARGETARCH.tar.gz && \
    echo "$GO_SHA256  $GOLANG_VERSION.linux-$TARGETARCH.tar.gz" | sha256sum -c - && \
    tar xf $GOLANG_VERSION.linux-$TARGETARCH.tar.gz && rm $GOLANG_VERSION.linux-$TARGETARCH.tar.gz
ENV PATH=$PATH:/opt/go/bin

# Only the static library: Blockbook links it, and skipping ldb and sst_dump halves the build.
ARG ROCKSDB_COMMIT=ae8fb3e5000e46d8d4c9dbf3a36019c0aaceebff
RUN git clone -b v9.10.0 --depth 1 https://github.com/facebook/rocksdb.git /opt/rocksdb && \
    test "$(git -C /opt/rocksdb rev-parse HEAD)" = "$ROCKSDB_COMMIT" && \
    cd /opt/rocksdb && \
    CFLAGS=-fPIC CXXFLAGS=-fPIC PORTABLE=1 DISABLE_WARNING_AS_ERROR=1 make -j"$(nproc)" static_lib
ENV CGO_CFLAGS="-I/opt/rocksdb/include"
ENV CGO_LDFLAGS="-L/opt/rocksdb -ldl -lrocksdb -lstdc++ -lm -lz -lbz2 -lsnappy -llz4 -lzstd"

# v0.6.0
ARG BLOCKBOOK_COMMIT=6e1299a2c4c31f7d5b94a53e293d8cfb8cafdfe4
RUN git init /src && cd /src && \
    git fetch --depth 1 https://github.com/trezor/blockbook.git $BLOCKBOOK_COMMIT && \
    git checkout FETCH_HEAD && \
    go build -o /out/blockbook -ldflags="-s -w -X github.com/trezor/blockbook/common.version=0.6.0 -X github.com/trezor/blockbook/common.gitcommit=$BLOCKBOOK_COMMIT"

FROM debian:bookworm-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates libzmq5 libgflags2.2 libsnappy1v5 zlib1g \
        libbz2-1.0 libzstd1 liblz4-1 && \
    rm -rf /var/lib/apt/lists/*
# Blockbook loads its HTML templates relative to the working directory.
COPY --from=build /src/static /opt/coins/blockbook/ethereum/static
COPY --from=build /out/blockbook /opt/coins/blockbook/ethereum/bin/blockbook
WORKDIR /opt/coins/blockbook/ethereum
ENTRYPOINT ["/opt/coins/blockbook/ethereum/bin/blockbook"]
