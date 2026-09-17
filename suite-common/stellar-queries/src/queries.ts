import { commonQueryKeys, createQueryDefinition } from '@suite-common/react-query';
import { type StellarTokenInfo } from '@suite-common/wallet-types';
import {
    buildStellarTokenInfo,
    lazyStellarTokenMetadata,
    resolveStellarContractId,
} from '@suite-common/wallet-utils';
import { type TokenDetailByMint } from '@trezor/blockchain-link-types';
import stellar from '@trezor/network-stellar/runtime';
import { type StellarAssetRef } from '@trezor/network-stellar/types';

/**
 * The published definitions and the lazily imported runtime are the same for every account and do
 * not change while the app is open, so a component may ask for them as often as it likes. They are
 * also what everything below is derived from, so they are kept even while nothing observes them.
 */
const sessionLongOptions = { staleTime: Infinity, gcTime: Infinity } as const;

/** Derived from the two above, and so free to rebuild once the last component loses interest. */
const derivedOptions = { staleTime: Infinity } as const;

/** The parts of the Stellar runtime a form needs to judge what was typed into it. */
export interface StellarAssetValidators {
    isValidAssetCode: (value: string) => boolean;
    isValidAddress: (value: string) => boolean;
    isValidContractId: (value: string) => boolean;
}

export const stellarAssetValidatorsQuery = createQueryDefinition<void, StellarAssetValidators>({
    queryKey: () => commonQueryKeys.stellarRuntime(),
    queryFn: async () => {
        const { isValidAssetCode, isValidAddress, isValidContractId } = await stellar();

        return { isValidAssetCode, isValidAddress, isValidContractId };
    },
    options: sessionLongOptions,
});

export const stellarTokenMetadataQuery = createQueryDefinition<void, TokenDetailByMint>({
    queryKey: () => commonQueryKeys.stellarTokenMetadata(),
    // `lazyStellarTokenMetadata` stays the one place the definitions are fetched, shared with the
    // thunks that put a token name into a trustline memo on the way to the device.
    queryFn: () => lazyStellarTokenMetadata.getOrInit(),
    options: sessionLongOptions,
});

export const stellarTokenInfoQuery = createQueryDefinition<string, StellarTokenInfo>({
    queryKey: contract => commonQueryKeys.stellarTokenInfo(contract),
    // Definitions that never arrive still leave an asset code and an issuer to show.
    queryFn: async contract =>
        buildStellarTokenInfo(
            contract,
            await lazyStellarTokenMetadata.getOrInit().catch(() => undefined),
        ),
    options: derivedOptions,
});

export const stellarContractAssetQuery = createQueryDefinition<string, StellarAssetRef | null>({
    queryKey: contractId => commonQueryKeys.stellarContractAsset(contractId),
    // `null` is "the definitions do not wrap this contract"; a query may not resolve to `undefined`.
    queryFn: async contractId => (await resolveStellarContractId(contractId)) ?? null,
    options: derivedOptions,
});
