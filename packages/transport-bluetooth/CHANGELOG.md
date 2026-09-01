# Changelog

### 0.4.4

- fix: macos scan filters on the Trezor service UUID instead of retaining every nearby BLE advertiser (memory growth)
- fix: notification stream tasks are owned by a central registry and aborted when their websocket client disconnects, BLE subscriptions are released with the last stream
- fix: broadcast listeners survive lagged channels instead of exiting silently

### 0.4.3

- feat: add linux pairing Agent and handle pairing PIN request
- fix: linux manual unpair via https://github.com/deviceplug/btleplug/pull/446
- fix: linux get_info when systemctl is disabled
- fix: linux abort pairing when system UI is missing
- fix: linux + macos, wait for missing characteristics

### 0.4.2

- added open_device/close_device characteristics param
- dispatching notifications from requested characteristics
- removed NAPI bindings
- fix: get_info method
- fix: linux connectionsStatus after unsuccessful connection

### 0.4.1

- breaking change in websocket api parameters, responses and notifications
- NAPI bindings used only in connectDevice flow
- fix: stop scanning when all clients disconnected

### 0.4.0

- add NAPI bindings for MacOS
- methods: set_state, connect_device, disconnect_device, forget_device, open, close, read, write

### 0.3.0

- add websocket server
- methods: get_info, start_scan, stop_scan, enumerate
