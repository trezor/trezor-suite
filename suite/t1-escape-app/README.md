# @suite/t1-escape-app (old Trezor One migration)

A standalone web page for owners of an old Trezor One (HID, firmware 1.3.6 to 1.6.3) who no longer have their recovery seed and therefore cannot safely update the firmware. It finds the bitcoin, ether or ether classic on the device and sweeps all of it to one destination address the user provides. One coin per page load.

The page reaches the device only through the bridge inside Trezor Suite desktop (`http://127.0.0.1:21328`, bridge version 3.3.0 or newer). It does not use `@trezor/connect`, WebUSB or WebHID. Blockchain data comes from Trezor's Bitcoin, Ethereum and Ethereum Classic blockbooks over WebSocket. Nothing is stored in the browser, and there is no analytics, error reporting or third-party script.

It is a separate bundle. Nothing in the repository imports it and it is not part of the Suite web or desktop build. Production target: `https://old-trezors.trezor.io`.

## Layout

- `src/firmware` — which firmware can do what (account types, destination formats, Ethereum floor, quirks).
- `src/bitcoin` — pure, fund-critical Bitcoin logic: destination validation, sweep composition, previous-transaction verification, verification of the signed transaction.
- `src/ethereum` — pure, fund-critical Ethereum logic: chain definitions, destination validation, sweep composition, verification of the signature against the plan.
- `src/device` — protobuf loading (including the legacy Ethereum message layout built at runtime), the device session loop, public keys and addresses, PIN and passphrase helpers, the bridge connection.
- `src/backend`, `src/discovery`, `src/migration` — blockbook access, account and address discovery, state reconstruction, signing orchestration, broadcast tracking, for both coins.
- `src/app`, `src/ui` — the flow controller (`createMigrationController` with the Ethereum half in `createEthereumFlow`) and thin React screens.
- `mocks` — test fixtures, including a fake firmware and in-memory blockbooks.

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

## Collecting logs from a test run

Nobody on the team has a device this old, so testing is done by people who have one. Two logs tell how far a run got:

- **The page's diagnostic log.** The last card on the page shows it and has "Copy log" and "Download log" buttons. It records every step, every message exchanged with the device (names only), every backend request and every error, with timings. It contains no PIN, passphrase, address, public key, transaction id or amount, and the page never sends it anywhere. The same lines go to the browser console.
- **The bridge log inside Trezor Suite.** Open `http://127.0.0.1:21328/status` in a browser and download the log from there. It shows what the HID backend did: whether it loaded, which interfaces it saw, whether the device could be opened, the report id probe on Windows, and every read and write. System paths and serial numbers are blanked out.

Ask testers for both, plus their operating system and the firmware version shown by the page.

## Production response headers

The hosting must send these headers. They are defined in `securityHeaders.ts`, and `vite preview` sends them as well.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self' 'unsafe-inline'; connect-src http://127.0.0.1:21328 wss://btc.trezor.io wss://eth.trezor.io wss://etc.trezor.io; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Permissions-Policy: local-network-access=(self), usb=(), hid=()
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Cross-Origin-Opener-Policy: same-origin
```

- `style-src 'unsafe-inline'` is needed by styled-components, as in Suite Web.
- `upgrade-insecure-requests` must not be added: the bridge is plain HTTP on loopback.
- The page must be the top-level document. The local network access prompt is not shown to framed pages.

Outside the repository: the blockbook servers must accept the `Origin` of the production host, and the production bridge allows HID access for exactly `https://old-trezors.trezor.io`.

## Ethereum and Ethereum Classic

After the device is accepted the page asks what to move: Bitcoin, Ethereum or Ethereum Classic. The Ethereum chains are offered on firmware 1.4.2 to 1.6.3 only: 1.4.0 added Ethereum signing, but the EIP-155 replay protection (`chain_id`) that today's nodes require came with 1.4.2. The device shows the amount with the ETC suffix for chain id 61 on all of these versions. Firmware 1.4.2 and 1.5.0 show the destination as lowercase hex without the `0x` prefix, 1.5.1 and newer show it EIP-55 checksummed; the page says so before signing.

- Discovery is by address, one account being one address. Ethereum scans `m/44'/60'/0'/0/i`; Ethereum Classic scans `m/44'/61'/0'/0/i` and also `m/44'/60'/0'/0/i`, because wallets from 2016 to 2018 kept ETC on the Ethereum keys after the fork. Each path family is followed from `i = 0` to the first address with no transactions and no balance, at most 20; "Scan more addresses" looks at 5 more per family. `EthereumGetAddress` is sent without `show_display`, so the device confirms nothing during discovery.
- Only the coin itself is moved. ERC-20 tokens and NFTs stay on the old device; the token balances blockbook reports are listed on the last screen.
- One transaction per address: a plain value transfer with gas limit 21000, the gas price being blockbook's estimate for the next block plus 20 %, rounded up to a whole wei and refused above 500 gwei (`MAX_GAS_PRICE_WEI` in `src/ethereum/composeEthereumSweep.ts`). The amount is the balance minus the fee; an address whose balance does not cover the fee is listed as left behind. While an address has a transaction in the mempool nothing is composed for it; the page keeps refreshing until it settles.
- The Ethereum messages are not taken from `@trezor/protobuf`. Firmware this old reads the destination as 20 bytes in field 5 of `EthereumSignTx` and answers `EthereumAddress` with 20 raw bytes; the shared schema differs in both places, and a transaction sent through it would be signed as a contract creation. `src/device/legacyEthereumMessages.ts` builds the old layout at runtime and a golden-bytes test pins it.
- Right before signing the address is requested from the device again and compared with the scanned one, and the backend must still report the nonce and the balance the plan was composed from. The signature the device returns must produce exactly the planned transaction and recover to the address being emptied; otherwise it is discarded. A plan that reached the device is never sent again: a retry composes a new one with a fresh nonce and gas price. A signed transaction is never signed again; a failed broadcast re-sends the stored bytes.
- Transfers are tracked by transaction id, which on these chains nobody can alter, together with the nonce and the pending count of the address: pending, confirmed, failed (mined but reverted), not in the mempool (unknown to the backend with the nonce still unused, so the bytes can be re-sent) or unknown.
- The warning about CVE-2020-14199 and the random fee padding are Bitcoin-only. Everything else, including the PIN, the passphrase, the device lock at the end and the diagnostic log, is shared.

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
- The legacy Ethereum message layout on firmware 1.4.2 to 1.6.3: that `EthereumSignTx` with the destination as 20 bytes in field 5, an empty `nonce` for zero and `chain_id` in field 9 is accepted, that `EthereumAddress` carries 20 raw bytes in field 1, and that `EthereumTxRequest` returns `signature_v` as `recovery + 2 * chain_id + 35` with no `data_length`.
- The Ethereum screens of the device: the amount with the ETH or ETC suffix, the destination (lowercase without `0x` on 1.4.2 and 1.5.0, checksummed since 1.5.1) and the fee screen.
- The gas price in practice: that the backend's estimate plus 20 % gets a transaction mined in reasonable time, and how the device reacts to a gas price near the 500 gwei cap (no "fee over threshold" warning is known for Ethereum on this firmware, but it was not tried).
- Blockbook behaviour on `eth.trezor.io` and `etc.trezor.io`: that `misc.nonce` is the next usable nonce, that `history.unconfirmed` counts a transaction the page just broadcast, and that `getTransaction` fails for an id the backend does not know rather than answering with an empty transaction.
