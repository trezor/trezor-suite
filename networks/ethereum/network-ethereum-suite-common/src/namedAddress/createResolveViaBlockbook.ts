import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { GetTrezorConnectDep } from '@trezor/network-module-suite-common-types';

export type ResolveViaBlockbookDeps = GetTrezorConnectDep<'getAccountInfo'>;

import { isAddressLike } from './namedAddressUtils';

/**
 * Forward-resolve a named input (ENS or other TLD) to its onchain address via Blockbook.
 *
 * Blockbook accepts the name as the account `descriptor` and returns the resolved hex
 * address back on `payload.descriptor` (see the descriptor override in
 * `@trezor/connect` getAccountInfo). We request `details: 'basic'` since we only need
 * the resolved descriptor, not the account's transaction history.
 *
 * @param value - ENS name or other TLD name.
 * @param symbol - Network symbol the name should be resolved on (e.g. `eth`).
 * @returns The resolved onchain address, or `null` when the answer is not one.
 */
export type ResolveViaBlockbook = (value: string, symbol: EthereumNetworkSymbol) => Promise<string>;

export type ResolveViaBlockbookDep = {
    resolveViaBlockbook: ResolveViaBlockbook;
};

export const createResolveViaBlockbook =
    (deps: ResolveViaBlockbookDeps): ResolveViaBlockbook =>
    async (value, symbol) => {
        const result = await deps.getTrezorConnect().getAccountInfo({
            descriptor: value,
            coin: symbol,
            details: 'basic',
        });

        if (!result.success) {
            throw new Error(result.error.message);
        }

        return result.payload.descriptor;
    };
