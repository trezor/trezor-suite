import type { GetTrezorConnectDep } from '@trezor/network-module-suite-common-types';

import type { ResolveNamedAddress } from './ResolveNamedAddress';

export type ResolveViaBlockbookDeps = GetTrezorConnectDep<'getAccountInfo'>;

import { isAddressLike } from './namedAddressUtils';

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

        return result.payload.descriptor;
    };
