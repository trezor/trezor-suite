# @suite/t1-escape-app (old Trezor One migration)

A standalone web page for owners of an old Trezor One (HID, firmware 1.3.6 to 1.6.3) who no longer have their recovery seed and therefore cannot safely update the firmware. It finds the bitcoin on the device and sweeps all of it to one destination address the user provides.

The page reaches the device only through the bridge inside Trezor Suite desktop (`http://127.0.0.1:21328`, bridge version 3.3.0 or newer). It does not use `@trezor/connect`, WebUSB or WebHID. Blockchain data comes from Trezor's Bitcoin blockbook over WebSocket. Nothing is stored in the browser, and there is no analytics, error reporting or third-party script.

It is a separate bundle. Nothing in the repository imports it and it is not part of the Suite web or desktop build. Production target: `https://old-trezors.trezor.io`.

## Layout

- `src/firmware` — which firmware can do what (account types, destination formats, quirks).
- `src/bitcoin` — pure, fund-critical logic: destination validation, sweep composition, previous-transaction verification, verification of the signed transaction.
- `src/device` — protobuf loading, the device session loop, public keys, PIN and passphrase helpers, the bridge connection.
- `src/backend`, `src/discovery`, `src/migration` — blockbook access, account discovery, state reconstruction, signing orchestration, broadcast tracking.
- `src/app`, `src/ui` — the flow controller and thin React screens.
- `mocks` — test fixtures, including a fake firmware and an in-memory blockbook.

## Development

The dev server must run on port 5181. Development builds of the bridge allow exactly the origin `http://localhost:5181` to open HID devices.

```bash
# Terminal 1: Trezor Suite desktop, which runs the bridge
yarn suite:dev:desktop

# Terminal 2: this app at http://localhost:5181
yarn workspace @suite/t1-escape-app dev
```

A standalone bridge works too, when started with `--hid-origin=http://localhost:5181`.

```bash
yarn workspace @suite/t1-escape-app test:unit --coverage=0
ESLINT_RUN_EXPENSIVE_CHECKS=true yarn workspace @suite/t1-escape-app lint:js
yarn workspace @suite/t1-escape-app build

# Serves the production build with the production response headers below
yarn workspace @suite/t1-escape-app preview
```

The `[Build] t1-escape-app` workflow builds every pull request that touches this package and uploads it to `https://dev.suite.sldev.cz/t1-escape-app/<branch>/`, the same way Suite Web is deployed. That copy is good for looking at the screens only: the bridge refuses to open a HID device for its origin.

## Production response headers

The hosting must send these headers. They are defined in `securityHeaders.ts`, and `vite preview` sends them as well.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self' 'unsafe-inline'; connect-src http://127.0.0.1:21328 wss://btc.trezor.io; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Permissions-Policy: local-network-access=(self), usb=(), hid=()
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Cross-Origin-Opener-Policy: same-origin
```

- `style-src 'unsafe-inline'` is needed by styled-components, as in Suite Web.
- `upgrade-insecure-requests` must not be added: the bridge is plain HTTP on loopback.
- The page must be the top-level document. The local network access prompt is not shown to framed pages.

Outside the repository: the blockbook servers must accept the `Origin` of the production host, and the production bridge allows HID access for exactly `https://old-trezors.trezor.io`.

## Fund-safety rules implemented here

- Only a Trezor One with firmware 1.3.6 to 1.6.3, initialized and not in bootloader mode, is accepted.
- The destination address is typed by the user, checked against what the firmware can pay to, and refused if it belongs to the scanned accounts.
- Each transaction spends coins of one account only, has a single output and no change, and takes at most 50 inputs. The fee rate is fixed (`SWEEP_FEE_RATE` in `src/bitcoin/composeSweep.ts`), plus a few random satoshi so that no two composed amounts are equal.
- Before signing, every input is proven against its previous transaction (hash, script, amount) and the account public key is requested from the device again.
- After signing, the transaction must be exactly the composed one. A signed transaction is never signed again; a failed broadcast re-sends the stored bytes.
- Transfers are tracked by the outpoints they spend, not by transaction id.

## Verifiable only on real hardware

There is no emulator for firmware this old, so the unit tests stop at the wire bytes. These points need a device:

- Bridge HID backend: exclusive access and a possible Input Monitoring prompt on macOS, report id handling on Windows, closing the device during a read, and whether the device is listed on Windows at all.
- Protocol on firmware 1.3.6, 1.5.x and 1.6.3: that `Features` and `PublicKey` carry every field today's schema marks as required, that the `TxAck*` messages (message id 22) are accepted, that the passphrase cache is cleared by `Initialize`, and that `LockDevice` (old `ClearSession`) answers with `Success`.
- Paying a P2SH address on firmware older than 1.5.0, which needs the output typed `PAYTOSCRIPTHASH`.
- The fixed fee rate does not trigger the "fee over threshold" warning on firmware 1.3.6 to 1.4.2.
- The local network access prompt on the production host in Chrome, Edge, Brave and Firefox.
- A whole migration with the Trezor Suite window open, which shows the device as unreadable.
- Blockbook behaviour the tracking relies on: an unconfirmed spend removes the outputs from the WebSocket `getAccountUtxo` answer, and pending transactions come first in the account history.
