import type { NetworkSymbol } from '@trezor/network-module-types';

export type ChainNetworkErrorCode =
    'account-info-failed' | 'symbol-mismatch' | 'unsupported-network';

/**
 * The only error chain networks throw.
 *
 * It carries a code and the network symbol and nothing else: backend messages can echo the
 * account descriptor, and errors are reported off the device.
 */
export class ChainNetworkError extends Error {
    readonly code: ChainNetworkErrorCode;
    readonly symbol: NetworkSymbol;

    constructor(code: ChainNetworkErrorCode, symbol: NetworkSymbol) {
        super(`Chain network ${symbol}: ${code}`);
        this.name = 'ChainNetworkError';
        this.code = code;
        this.symbol = symbol;
    }
}
