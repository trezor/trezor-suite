/* eslint-disable no-console */

import { BITCOIN_ONLY_SYMBOLS, BitcoinOnlySymbolsItemType } from '@suite-common/suite-constants';
import { isArrayMember } from '@trezor/utils';

import { CoinjoinBackend } from '../src/backend/CoinjoinBackend';
import type { CoinjoinBackendSettings } from '../src/types';

const { getCoinjoinConfig } = require('../../suite/src/services/coinjoin/config');

const isSupportedSymbol = (symbol: string): symbol is BitcoinOnlySymbolsItemType =>
    isArrayMember(symbol, BITCOIN_ONLY_SYMBOLS);

export const getAccountInfoParams = (symbol: string, descriptor: string) => {
    if (!symbol) throw new Error('symbol arg missing');
    if (!isSupportedSymbol(symbol)) throw new Error('unsupported symbol');
    if (!descriptor) throw new Error('descriptor arg missing');

    const config: CoinjoinBackendSettings = getCoinjoinConfig(symbol);

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
        const now = new Date().toLocaleTimeString();
        if ('activity' in e) console.log('🔄', now, e.stage, e.activity);
        if (e.progress) console.log('⌛', now, e.progress.current);
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
