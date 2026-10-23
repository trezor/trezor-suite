# @suite/t1-escape-app (old Trezor One migration)

A standalone web page for owners of an old Trezor One (HID, firmware 1.3.6 to 1.6.3) who no longer have their recovery seed and therefore cannot safely update the firmware. In one run it finds the bitcoin, ether and ether classic on the device and signs the transactions that sweep all of it to destination addresses the user provides, one per coin. The page never broadcasts: the user takes the signed hex to the Trezor explorer, and the page watches the network for it (see [The page never broadcasts](#the-page-never-broadcasts)).

The page reaches the device only through the bridge inside Trezor Suite desktop (`http://127.0.0.1:21328`, bridge version 3.3.0 or newer). It does not use `@trezor/connect`, WebUSB or WebHID. Blockchain data comes from Trezor's Bitcoin, Ethereum and Ethereum Classic blockbooks over WebSocket. Nothing is stored in the browser, and there is no analytics, error reporting or third-party script.

It is a separate bundle. Nothing in the repository imports it and it is not part of the Suite web or desktop build. Production target: `https://old-trezors.trezor.io`.

## Layout

- `src/firmware` — which firmware can do what (account types, destination formats, Ethereum floor, quirks).
- `src/bitcoin` — pure, fund-critical Bitcoin logic: destination validation, sweep composition, previous-transaction verification, verification of the signed transaction.
- `src/ethereum` — pure, fund-critical Ethereum logic: chain definitions, destination validation, sweep composition, verification of the signature against the plan.
- `src/device` — protobuf loading (including the legacy Ethereum message layout built at runtime), the device session loop, public keys and addresses, PIN and passphrase helpers, the bridge connection.
- `src/backend`, `src/discovery`, `src/migration` — blockbook access (read only), account and address discovery, state reconstruction, signing orchestration, network tracking of the signed transactions, for both coins.
- `src/app`, `src/ui` — the flow controller (`createMigrationController`, with the Ethereum transfers in `ethereumTransfers`) and thin React screens, each showing every coin.
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

## What is scanned and moved

One run of the page goes through every coin the firmware can sign for, on one device session, and then signs the transactions that move all of it: intro, preflight, device, passphrase, discovery, destination, transfers, summary. The discovery screen shows the result per coin, the destination screen asks for one address per coin that holds something, the transfers screen lists the transactions of every coin, and the summary judges all coins together.

- **Bitcoin**, on every firmware in scope. Accounts are discovered by type: Legacy (`m/44'`) on every version, Legacy SegWit (`m/49'`) from 1.5.1 and SegWit (`m/84'`) from 1.6.0, each from account 0 to the first account without history, at most 20; "Scan more accounts" looks at 5 more per type. The address gap is 100.
- **Ethereum and Ethereum Classic**, on firmware 1.4.2 to 1.6.3 only: 1.4.0 added Ethereum signing, but the EIP-155 replay protection (`chain_id`) that today's nodes require came with 1.4.2. On older firmware the two chains are not scanned and the scan report says why. Discovery is by address, one account being one address. Ethereum scans `m/44'/60'/0'/0/i`; Ethereum Classic scans `m/44'/61'/0'/0/i` and also `m/44'/60'/0'/0/i`, because wallets from 2016 to 2018 kept ETC on the Ethereum keys after the fork. Each path family is followed from `i = 0` to the first address with no transactions and no balance, at most 20; "Scan more addresses" looks at 5 more per family. `EthereumGetAddress` is sent without `show_display`, so the device confirms nothing during discovery.
- A blockbook that cannot be reached ends the scan of its coin only: the error is shown for that coin, the other coins stay usable, and the scan report names the coin whose scan was cut short. A device error (wrong PIN, disconnect) stops the whole discovery. With a passphrase, the NFKD-normalized form is tried first and the form exactly as typed only when the normalized wallet is empty for every coin; a coin whose server failed is not known to be empty, so the fallback is never taken on partial information.
- Not moved: ERC-20 tokens and NFTs (the balances blockbook reports are listed on the last screen), other EVM chains, Bitcoin forks, Taproot, custom derivation paths and multisig.

### Ethereum details

- The device shows the amount with the ETC suffix for chain id 61 on all of these versions. Firmware 1.4.2 and 1.5.0 show the destination as lowercase hex without the `0x` prefix, 1.5.1 and newer show it EIP-55 checksummed; the transfers screen says so before signing.
- The Ethereum and Ethereum Classic destinations may be the same address; each is refused only if it belongs to the scanned addresses of either chain, since the `m/44'/60'` keys are shared.
- One transaction per address: a plain value transfer with gas limit 21000, the gas price being blockbook's estimate for the next block plus 20 %, rounded up to a whole wei and refused above 500 gwei (`MAX_GAS_PRICE_WEI` in `src/ethereum/composeEthereumSweep.ts`). The amount is the balance minus the fee; an address whose balance does not cover the fee is listed as left behind. While an address has a transaction in the mempool nothing is composed for it; the page keeps refreshing until it settles.
- The Ethereum messages are not taken from `@trezor/protobuf`. Firmware this old reads the destination as 20 bytes in field 5 of `EthereumSignTx` and answers `EthereumAddress` with 20 raw bytes; the shared schema differs in both places, and a transaction sent through it would be signed as a contract creation. `src/device/legacyEthereumMessages.ts` builds the old layout at runtime and a golden-bytes test pins it.
- Right before signing the address is requested from the device again and compared with the scanned one, and the backend must still report the nonce and the balance the plan was composed from. The signature the device returns must produce exactly the planned transaction and recover to the address being emptied; otherwise it is discarded. A plan that reached the device is never sent again: a retry composes a new one with a fresh nonce and gas price. A signed transaction is never signed again; the signed bytes are shown and kept until the page is closed.
- Transfers are tracked by transaction id, which on these chains nobody can alter, together with the nonce and the pending count of the address: pending, confirmed, failed (mined but reverted), not in the mempool (unknown to the backend with the nonce still unused, so the bytes can still be broadcast) or unknown. A signed transfer counts as on the network once the backend reports it pending, confirmed or failed. One ledger covers both chains; every plan in it carries its chain id.
- The warning about CVE-2020-14199 and the random fee padding are Bitcoin-only. Everything else, including the PIN, the passphrase, the device lock at the end and the diagnostic log, is shared.

## The page never broadcasts

The page signs transactions and watches the network; it never hands a transaction to a node. For every transaction the user signs, the transfers screen shows the signed transaction as hex with a Copy button, its transaction id, and three numbered steps:

1. Check the transaction in an independent decoder before broadcasting it: `https://live.blockcypher.com/btc/decodetx/` for Bitcoin, `https://tools.deth.net/tx-decoder` for Ethereum and Ethereum Classic. The page says what to compare (the destination address and the amount; for Ethereum also that the sender is the old address and that the chain id is 1 or 61) and that the pasted hex becomes known to that site.
2. Broadcast it on the Trezor explorer, in blockbook's "Send Raw Transaction" form: `https://btc.trezor.io/sendtx`, `https://eth.trezor.io/sendtx` or `https://etc.trezor.io/sendtx`.
3. Come back. The page asks the network every half minute, and at once when "Check the network now" is pressed. The explorer page of the transaction (`/tx/<txid>` on the same host) is linked as well; it works once the transaction is broadcast.

A signed transfer stays "signed" until the backend shows the transaction: for Bitcoin, once its inputs are spent by it (pending, confirmed, or spent by another transaction); for Ethereum, once the backend knows the transaction id (pending, confirmed or failed). "Not in the mempool" and "unknown" leave it signed. Until then the hex stays on display, and locking the Trezor keeps the page on the transfers screen so that the hex stays visible. Once seen on the network, the hex is hidden; the transaction id, the explorer link and the status stay, and the status keeps refreshing until it is final. A Bitcoin account that needs more than one transaction gets the next one composed when the previous one is seen on the network.

The URLs are defined once each: the Bitcoin explorer and decoder in `src/bitcoin/bitcoinNetwork.ts`, the Ethereum ones in `src/ethereum/ethereumChain.ts`. The links open in a new tab with `rel="noopener noreferrer"` and the page sends `Referrer-Policy: no-referrer`. They are navigations, not connections, so the `connect-src` of the production CSP below stays as it is.

## Fund-safety rules implemented here

- Only a Trezor One with firmware 1.3.6 to 1.6.3, initialized and not in bootloader mode, is accepted.
- The destination addresses are typed by the user, one per coin, checked against what the firmware can pay to, and refused if they belong to the scanned accounts or addresses. Nothing is composed until every address is accepted.
- Each transaction spends coins of one account only, has a single output and no change, and takes at most 50 inputs. The fee rate is fixed (`SWEEP_FEE_RATE` in `src/bitcoin/composeSweep.ts`), plus a few random satoshi so that no two composed amounts are equal.
- Before signing, every input is proven against its previous transaction (hash, script, amount) and the account public key is requested from the device again.
- After signing, the transaction must be exactly the composed one. The signed bytes are shown and kept until the page is closed; the page never signs the same transaction twice.
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
- Blockbook behaviour on `eth.trezor.io` and `etc.trezor.io`: that `misc.nonce` is the next usable nonce, that `history.unconfirmed` counts a transaction the user just broadcast, and that `getTransaction` fails for an id the backend does not know rather than answering with an empty transaction.
- The explorer links: that the `/sendtx` form of the three blockbooks accepts the hex the page shows, and that the two decoders read it the way the page describes.
