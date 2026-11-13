import type { GetTrezorBlockchainDep } from '@trezor/blockchain-core';

import type { ResolveNamedAddress } from './ResolveNamedAddress';
import { isAddressLike } from './namedAddressUtils';

export type ResolveNamedAddressViaBlockbookDeps = GetTrezorBlockchainDep<'getAccountInfo'>;

/**
 * Forward-resolve a named input (ENS or other TLD) to its onchain address via Blockbook.
 *
 * Blockbook accepts the name as the account `descriptor` and returns the resolved hex
 * address back on `payload.descriptor` (see the descriptor override in
 * `@trezor/blockchain-core` getAccountInfo). We request `details: 'basic'` since we only need
 * the resolved descriptor, not the account's transaction history.
 */
export const createResolveNamedAddressViaBlockbook =
    (deps: ResolveNamedAddressViaBlockbookDeps): ResolveNamedAddress =>
    async (value, symbol, options) => {
        const result = await deps.getTrezorBlockchain().getAccountInfo({
            descriptor: value,
            coin: symbol,
            identity: options?.identity,
            details: 'basic',
        });

        if (!result.success) {
            throw new Error(result.error.message);
        }

        // The descriptor is whatever the backend made of the name, and it is signed as the
        // recipient. Anything that is not an address is no answer, not a different one.
        const { descriptor } = result.payload;

        return isAddressLike(descriptor) ? descriptor : null;
    };
