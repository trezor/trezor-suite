import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type {
    NamedAddressProfile,
    NetworkSuiteCommonModuleApi,
} from '@trezor/network-module-suite-common-types';

import { createResolveViaBlockbook } from './resolveNamedAddressBB';
import { createUniversalResolver } from './universalResolver';

type ResolveNamedAddressDeps = NetworkSuiteCommonModuleApi;

type ResolveNamedAddress = {
    resolveNamedAddress(value: string, symbol: EthereumNetworkSymbol): Promise<string | null>;
    resolveNamedProfileOnchain(
        value: string,
        symbol: EthereumNetworkSymbol,
        textKeys?: readonly string[],
    ): Promise<NamedAddressProfile>;
    reverseResolveAddressOnchain(
        address: string,
        symbol: EthereumNetworkSymbol,
    ): Promise<string | null>;
};

/**
 * Forward-resolve a named input, preferring a direct UniversalResolver call over Blockbook's
 * descriptor-based resolution.
 *
 * A `null` result is a definitive "no record" answer, so only a thrown error — an unreachable
 * or erroring backend — is worth retrying through Blockbook.
 */
export const createResolveNamedAddress = (deps: ResolveNamedAddressDeps): ResolveNamedAddress => {
    const { resolveNamedAddressOnchain, resolveNamedProfileOnchain, reverseResolveAddressOnchain } =
        createUniversalResolver(deps);
    const resolveViaBlockbook = createResolveViaBlockbook(deps);
    const resolveNamedAddress = async (value: string, symbol: EthereumNetworkSymbol) => {
        try {
            return await resolveNamedAddressOnchain(value, symbol);
        } catch {
            return resolveViaBlockbook(value, symbol);
        }
    };

    return { resolveNamedAddress, resolveNamedProfileOnchain, reverseResolveAddressOnchain };
};
