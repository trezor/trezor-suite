/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */

// @ts-ignore
import { getCoinjoinConfig } from '../../suite/src/services/coinjoin/config';
import { CoinjoinBackend } from '../src/backend/CoinjoinBackend';

const supportedNetworks = ['btc', 'test', 'regtest'] as const;
const isSupportedNetwork = (network: string): network is typeof supportedNetworks[number] =>
    supportedNetworks.includes(network as any);

const [network, descriptor] = process.argv.slice(2);

if (!network) throw new Error('network arg missing');
if (!isSupportedNetwork(network)) throw new Error('unsupported network');
if (!descriptor) throw new Error('descriptor arg missing');

const config = getCoinjoinConfig(network);

(async () => {
    console.log('✅', 'Start');

    const backend = new CoinjoinBackend(config);
    const transactions: Parameters<typeof backend['getAccountInfo']>[1] = [];

    backend.on('log', message => {
        console.log('🌐', message);
    });

    backend.on(`progress/${descriptor}`, e => {
        transactions.push(...e.transactions);
        if (e.info?.progress)
            console.log('⌛', e.info.progress, `(block: ${e.checkpoint.blockHeight})`);
        if (e.transactions.length)
            console.log(
                '🎯',
                `${e.transactions.length} txs`,
                `(block: ${e.checkpoint.blockHeight})`,
            );
    });

    const { checkpoint, pending, cache } = await backend.scanAccount({ descriptor });

    transactions.push(...pending);

    backend.removeAllListeners();

    const accountInfo = await backend.getAccountInfo(descriptor, transactions, checkpoint, cache);

    console.log('✅', 'End, printing account info:');
    console.log(JSON.stringify(accountInfo, null, 4));
})();
