import type { CallEnsUniversalResolverDeps } from './createCallEnsUniversalResolver';
import {
    type EthereumNamedAddressResolverDep,
    createEthereumNamedAddressResolver,
} from './createEthereumNamedAddressResolver';
import { createResolveNamedAddress } from './createResolveNamedAddress';
import {
    type ResolveNamedAddressViaBlockbookDeps,
    createResolveNamedAddressViaBlockbook,
} from './createResolveNamedAddressViaBlockbook';

export type EthereumNamedAddressResolverCompositionRootDeps = CallEnsUniversalResolverDeps &
    ResolveNamedAddressViaBlockbookDeps;

export type EthereumNamedAddressResolverCompositionRoot = EthereumNamedAddressResolverDep;

export const createEthereumNamedAddressResolverCompositionRoot = (
    deps: EthereumNamedAddressResolverCompositionRootDeps,
): EthereumNamedAddressResolverCompositionRoot => {
    // Keep viem and calldata lazy for metadata-only consumers. Loading stays outside
    // the resolution timeout and fallback.
    const loadResolver = async () => {
        const [
            { createCallEnsUniversalResolver },
            { createResolveNamedAddressViaEnsUniversalResolver },
            { createReverseResolveAddressViaEnsUniversalResolver },
        ] = await Promise.all([
            import('./createCallEnsUniversalResolver'),
            import('./createResolveNamedAddressViaEnsUniversalResolver'),
            import('./createReverseResolveAddressViaEnsUniversalResolver'),
        ]);
        const callEnsUniversalResolver = createCallEnsUniversalResolver(deps);

        return {
            resolveNamedAddress: createResolveNamedAddress({
                resolveNamedAddressOnchain: createResolveNamedAddressViaEnsUniversalResolver({
                    callEnsUniversalResolver,
                }),
                resolveViaBlockbook: createResolveNamedAddressViaBlockbook(deps),
            }),
            reverseResolveAddress: createReverseResolveAddressViaEnsUniversalResolver({
                callEnsUniversalResolver,
            }),
        };
    };

    return {
        ethereumNamedAddressResolver: createEthereumNamedAddressResolver({
            resolveNamedAddress: async (value, symbol) =>
                (await loadResolver()).resolveNamedAddress(value, symbol),
            reverseResolveAddress: async (address, symbol) =>
                (await loadResolver()).reverseResolveAddress(address, symbol),
        }),
    };
};
