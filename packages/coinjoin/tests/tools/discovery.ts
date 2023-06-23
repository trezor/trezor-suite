/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

import { CoinjoinBackend } from '../../src/backend/CoinjoinBackend';
import type { CoinjoinBackendSettings } from '../../src/types';

const { getCoinjoinConfig } = require('../../../suite/src/services/coinjoin/config');

const supportedNetworks = ['btc', 'test', 'regtest'] as const;
const isSupportedNetwork = (network: string): network is (typeof supportedNetworks)[number] =>
    supportedNetworks.includes(network as any);

export const getAccountInfoParams = (network: string, descriptor: string) => {
    if (!network) throw new Error('network arg missing');
    if (!isSupportedNetwork(network)) throw new Error('unsupported network');
    if (!descriptor) throw new Error('descriptor arg missing');

    const config: CoinjoinBackendSettings = getCoinjoinConfig(network);

    return {
        descriptor,
        config,
    };
};

export const getAccountInfo = async ({
    descriptor,
    config,
}: ReturnType<typeof getAccountInfoParams>) => {
    const backend = new CoinjoinBackend(config);
    const transactions: Parameters<(typeof backend)['getAccountInfo']>[1] = [];

    backend.on('log', ({ level, payload }) =>
        console[level]('🌐', new Date().toLocaleTimeString(), payload),
    );

    backend.on(`progress-info/${descriptor}`, e => {
        if (e.progress) console.log('⌛', new Date().toLocaleTimeString(), e.progress, e.message);
    });

    backend.on(`progress/${descriptor}`, e => {
        if (e.transactions.length) {
            transactions.push(...e.transactions);
            console.log(
                '🎯',
                new Date().toLocaleTimeString(),
                `${e.transactions.length} txs`,
                `(block: ${e.checkpoint.blockHeight})`,
            );
        }
    });

    const { checkpoint, pending, cache } = await backend.scanAccount({ descriptor });

    transactions.push(...pending);

    backend.removeAllListeners();

    return backend.getAccountInfo(descriptor, transactions, checkpoint, cache);
};
