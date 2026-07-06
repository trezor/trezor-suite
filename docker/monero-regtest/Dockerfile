# Monero regtest backend for the Trezor Suite E2E harness — the analogue of
# trezor-user-env/docker/bitcoin-regtest/Dockerfile (no blockbook: a Monero wallet scans
# the daemon directly via the view key). Drop this directory into trezor-user-env/docker/
# and wire the service into compose.yml (see README → "Porting to trezor-user-env").
FROM debian:bookworm-slim

ARG MONERO_VERSION=v0.18.5.0
ARG TARGETPLATFORM
RUN apt-get update -y \
  && apt-get install -y curl bzip2 ca-certificates procps python3 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Fetch monerod + monero-wallet-rpc (pin a clean version; v0.18.1.1 had regtest issue #8600).
RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then PLAT=linux-armv8; else PLAT=linux-x64; fi \
  && curl -fSL -o /tmp/monero.tar.bz2 "https://downloads.getmonero.org/cli/monero-${PLAT}-${MONERO_VERSION}.tar.bz2" \
  && tar -xjf /tmp/monero.tar.bz2 -C /tmp \
  && cp /tmp/monero-*/monerod /tmp/monero-*/monero-wallet-rpc /usr/local/bin/ \
  && chmod +x /usr/local/bin/monerod /usr/local/bin/monero-wallet-rpc \
  && rm -rf /tmp/monero*

WORKDIR /opt/monero-regtest
COPY control.sh entrypoint.sh ./
RUN chmod +x control.sh entrypoint.sh && mkdir -p /data

# 18081 daemon RPC (the Suite scan worker connects here); 18083 wallet-rpc is internal.
EXPOSE 18081
ENTRYPOINT ["./entrypoint.sh"]
