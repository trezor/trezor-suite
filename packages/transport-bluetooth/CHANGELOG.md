# Changelog

### 0.5.0

- feat: connection token authorization
- update dependencies (forked btleplug 0.13.4 with additional fixes)
- update dependencies (forked btleplug 0.13.4 additional fixes)
- fix: notification stream tasks are owned by a central registry and aborted when their websocket client disconnects, BLE subscriptions are released with the last stream
- fix: scanning stops when the last websocket client disconnects, regardless of which client started it
- fix: stop_scan resets the scanning flag even when called by another client or when the adapter call fails
- fix: reject notification streams registered after their websocket client disconnects, abort their tasks and release BLE subscriptions
- fix: stop_scan aborts scan watchers for all websocket clients, preventing duplicate watchers when another client stops scanning
- fix: linux pairing fails when the BlueZ Paired property is unreadable and accepts Pair errors when the device is already bonded
- fix: a successful connection clears a previous PairingError
- fix: handle RssiUpdate alongside DeviceUpdated to keep device properties updated on linux
- fix: prefer advertisement_name over local_name for device names and require an advertised name when tracking devices without services
- fix: linux resolves services before unsubscribing to release BLE subscriptions, skipping disconnected devices

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
