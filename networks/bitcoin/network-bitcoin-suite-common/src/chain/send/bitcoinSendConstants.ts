import { asNetworkSymbol } from '@trezor/network-module-types';

// A popular choice is to use 0xFFFFFFFD for your sequence fields,
// as this enables both the locktime field (in case you want to use it)
// and also replace-by-fee (which is generally useful).
export const BTC_RBF_SEQUENCE = 0xffffffff - 2;

// Locktime enabled, but RBF disabled
export const BTC_LOCKTIME_SEQUENCE = 0xffffffff - 1;

export const BITCOIN_ONLY_SYMBOLS = [
    asNetworkSymbol('btc'),
    asNetworkSymbol('test'),
    asNetworkSymbol('regtest'),
] as const;
