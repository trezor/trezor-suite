# Operating the development WARD service

## Wallet channel

Start the local service from the Suite workspace.

```sh
yarn workspace @trezor/wardd start
```

The default listener is on loopback port 21329. The default data directory is ~/.trezor-ward. It holds the SQLite replica, the local development manager's saved state and a user-readable pairing token. Browsers also need an allowed origin.

| Option                 | Effect                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| --port, --data-dir     | Select a loopback port or local data directory.                                          |
| --token-file, --origin | Supply the pairing token file or allowed browser origins.                                |
| --wm                   | Use a separate manager at the specified URL.                                             |
| --without-wm           | Use the manager-free MVP with matching firmware. This mode excludes an external manager. |
| --memory               | Use an in-memory replica and, when selected, an in-memory development manager.           |
| --relay                | Replicate the persistent store through the specified Evolu relay.                        |

For a supervised installation, track the daemon process itself. Stopping a workspace launcher alone can leave its child running.

## Dedicated service interface

For an emulator with the optional legacy service interface, start wardd in service mode.

```sh
yarn workspace @trezor/wardd start --service --port 21324
```

The port identifies the emulator's wallet interface. The service interface is seven ports higher. The daemon probes that interface and serves the identity-free transport. The paired service transport requires a different daemon.

Use --state-file with a path to retain the wallet, replica history and development manager state across restarts. This mode serves one wallet and uses a development manager. Its recovery options differ from those on the ordinary wallet channel. See the [service overview](README.md).
