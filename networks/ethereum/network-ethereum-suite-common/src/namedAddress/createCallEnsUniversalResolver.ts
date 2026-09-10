import type { Hex } from 'viem';

import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type { GetTrezorConnectDep } from '@trezor/network-module-suite-common-types';

import { asHex } from './ensUniversalResolverUtils';
import { ONCHAIN_CALL_TIMEOUT_MS } from './namedAddressUtils';

// ENSIP-19 UniversalResolver. Deployed at the same address on every chain we support,
// mainnet and Sepolia included (see viem's `chains` contract registry).
const UNIVERSAL_RESOLVER_ADDRESS = '0xeeeeeeee14d718c2b47d9923deab1335e144eeee';

// `eth_call` needs a sender; a read against the resolver does not care which.
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type CallEnsUniversalResolverDeps = GetTrezorConnectDep<'blockchainEvmRpcCall'>;

export type CallEnsUniversalResolver = (symbol: EthereumNetworkSymbol, data: Hex) => Promise<Hex>;

export type CallEnsUniversalResolverDep = {
    callEnsUniversalResolver: CallEnsUniversalResolver;
};

export const createCallEnsUniversalResolver =
    (deps: CallEnsUniversalResolverDeps): CallEnsUniversalResolver =>
    async (symbol, data) => {
        // The loser of the race has to be cleaned up: an uncleared timer keeps the event loop
        // busy for the full timeout after every single resolution.
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        try {
            const response = await Promise.race([
                deps.getTrezorConnect().blockchainEvmRpcCall({
                    coin: symbol,
                    from: ZERO_ADDRESS,
                    to: UNIVERSAL_RESOLVER_ADDRESS,
                    data,
                }),
                new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(
                        () => reject(new Error('Name resolution timed out')),
                        ONCHAIN_CALL_TIMEOUT_MS,
                    );
                }),
            ]);

            if (!response.success) {
                throw new Error(response.error.message);
            }

            return asHex(response.payload.data);
        } finally {
            clearTimeout(timeoutId);
        }
    };
