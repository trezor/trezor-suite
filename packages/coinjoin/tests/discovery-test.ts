/* eslint-disable no-console */

import { CoinjoinBackend } from '../src/backend/CoinjoinBackend';

const descriptor =
    "tr([5c9e228d/10025'/1'/0'/1']tpubDEMKm4M3S2Grx5DHTfbX9et5HQb9KhdjDCkUYdH9gvVofvPTE6yb2MH52P9uc4mx6eFohUmfN1f4hhHNK28GaZnWRXr3b8KkfFcySo1SmXU/<0;1>/*)";

const config = {
    network: 'test',
    coordinatorUrl: 'https://wasabiwallet.co/WabiSabi/', // (tor http://testwnp3fugjln6vh5vpj7mvq3lkqqwjj3c2aafyu7laxz42kgwh2rad.onion/WabiSabi/)
    // coordinatorUrl: 'https://dev-coinjoin-testnet.trezor.io',
    wabisabiBackendUrl: 'https://wasabiwallet.co/', // (tor http://testwnp3fugjln6vh5vpj7mvq3lkqqwjj3c2aafyu7laxz42kgwh2rad.onion/)
    // wabisabiBackendUrl: 'https://dev-coinjoin-testnet.trezor.io/',
    blockbookUrls: ['https://tbtc1.trezor.io/api/v2', 'https://tbtc2.trezor.io/api/v2'],
    baseBlockHeight: 0,
    // baseBlockHash: '00000000000000018edfd007d07aea6ade16a117b2c0a5d57b3173c33e7ab807', // 2377432 (current)
    // baseBlockHash: '0000000000006f5a1958de7f2ddd3157fb2f12a392b4e034e09d30da8151195c', // 2367432 (current - 50 tys, ~1 btc year) ~ 15 sec scan
    // baseBlockHash: '00000000000036741fb6820bd5eea02a6fa594c6f79d79cc2f64042e769626c9', // 2167432 (current - 250 tys) failed/freeze at 50%
    // baseBlockHash: '000000001eec9e483ddc3a9f2eea25b2639887def9ee2816c748b77248335c08', // 1746250 (all all 49'/1'/0' first tx)
    baseBlockHash: '00000000000f0d5edcaeba823db17f366be49a80d91d15b77747c2e017b8c20a', // 828575 (wasabi prod) infinite scan :)
} as const;

(async () => {
    console.log('=== Start');

    const backend = new CoinjoinBackend(config);

    backend.on('log', message => {
        console.log(message);
    });

    backend.on(`progress/${descriptor}`, e => {
        console.log(
            `=== Block: ${e.checkpoint.blockHeight}, Progress: ${e.info?.progress}, Txs: ${e.transactions.length}`,
        );
    });

    await backend.scanAccount({ descriptor });

    backend.removeAllListeners();

    console.log('=== End');
})();
