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
| --quota-manager        | With --relay, ask this Quota Manager whether the WARD owner has storage on the relay.    |
| --suite-sync           | Use Suite Sync's relay and Quota Manager: local, dev or prod. Excludes --relay.          |

For a supervised installation, track the daemon process itself. Stopping a workspace launcher alone can leave its child running.

## Suite Sync storage

The status reply carries `replication`: whether the records reach other hosts, the reason when they do not, the number of local records waiting, and `needBytes`, the storage to allocate now. The holder of the device's delegated Suite Sync key allocates it. connect-cli does so with `--suite-sync` or `--quota-manager` on `ward_sync`, `ward_flush` and `ward_status` through wardd.

For a local stack that behaves like Suite Sync, start the development relay with a Quota Manager stand-in on the next port:

```sh
yarn workspace @trezor/wardd tsx src/relayCli.ts --port 4000 --data-dir /tmp/relay --quota-manager-port 4001
yarn workspace @trezor/wardd start --suite-sync local
```

The relay then admits the WARD owner only once it is funded and refuses writes beyond its storage. The stand-in gives each device 1 MiB of quota in place of a registration, which needs a genuine device. `packages/connect-cli/e2e/ward-suite-sync.sh` runs the whole flow against an emulator.

## Dedicated service interface

For an emulator with the optional legacy service interface, start wardd in service mode.

```sh
yarn workspace @trezor/wardd start --service --port 21324
```

The port identifies the emulator's wallet interface. The service interface is seven ports higher. The daemon probes that interface and serves the identity-free transport. The paired service transport requires a different daemon.

Use --state-file with a path to retain the wallet, replica history and development manager state across restarts. This mode serves one wallet and uses a development manager. Its recovery options differ from those on the ordinary wallet channel. See the [service overview](README.md).
