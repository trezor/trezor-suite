FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        bluez \
        dbus \
        libgcc-s1 \
        python3 \
        python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir bumble==0.0.235 aiohttp==3.12.15

COPY ble_emulator.py peripheral.py /opt/mock/
COPY entrypoint.sh /opt/entrypoint.sh
RUN chmod +x /opt/entrypoint.sh

# the trezor-bluetooth binary is mounted at runtime, see docker-compose.yml
ENTRYPOINT ["/opt/entrypoint.sh"]
