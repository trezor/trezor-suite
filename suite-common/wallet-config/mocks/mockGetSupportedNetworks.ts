import { asNetworkSymbols } from '@trezor/network-module-types';

import type { NetworkSymbol } from '../src/networkTypes';

export const mockGetSupportedNetworks = (): readonly NetworkSymbol[] =>
    asNetworkSymbols([
        'btc',
        'eth',
        'pol',
        'bsc',
        'arb',
        'base',
        'op',
        'rhc',
        'hype',
        'avax',
        'sol',
        'trx',
        'ada',
        'etc',
        'xrp',
        'xlm',
        'ltc',
        'bch',
        'doge',
        'zec',
        'test',
        'regtest',
        'tsep',
        'thod',
        'dsol',
        'txrp',
        'txlm',
        'ttrx',
    ]);
