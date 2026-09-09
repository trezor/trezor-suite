import type { GetTrezorConnectDep } from '@trezor/network-module-suite-common-types';

import type { ResolveNamedAddress } from './ResolveNamedAddress';
import { isAddressLike } from './namedAddressUtils';

export type ResolveViaBlockbookDeps = GetTrezorConnectDep<'getAccountInfo'>;

/**
 * Forward-resolve a named input (ENS or other TLD) to its onchain address via Blockbook.
 *
 * Blockbook accepts the name as the account `descriptor` and returns the resolved hex
 * address back on `payload.descriptor` (see the descriptor override in
 * `@trezor/connect` getAccountInfo). We request `details: 'basic'` since we only need
 * the resolved descriptor, not the account's transaction history.
 */
// eslint-disable-next-line local-rules/enforce-di-factory-contracts -- Blockbook implements the shared ResolveNamedAddress contract.
export const createResolveViaBlockbook =
    (deps: ResolveViaBlockbookDeps): ResolveNamedAddress =>
    async (value, symbol) => {
        const result = await deps.getTrezorConnect().getAccountInfo({
            descriptor: value,
            coin: symbol,
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
