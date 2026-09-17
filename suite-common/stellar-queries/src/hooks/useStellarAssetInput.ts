import { useQueries } from '@suite-common/react-query';

import {
    stellarAssetValidatorsQuery,
    stellarContractAssetQuery,
    stellarTokenMetadataQuery,
} from '../queries';

/**
 * What a manual token form can say about the value typed into its asset-code field.
 *
 * The validators and the token definitions load side by side, so a pasted Stellar Asset Contract id
 * is resolved as soon as it is recognised instead of starting a second round trip after it.
 */
export const useStellarAssetInput = (assetCodeOrContractId: string) => {
    const [validators, tokenMetadata] = useQueries({
        queries: [stellarAssetValidatorsQuery.options(), stellarTokenMetadataQuery.options()],
    });

    const isContractId = validators.data?.isValidContractId(assetCodeOrContractId) ?? false;

    const contractAsset = stellarContractAssetQuery.use(assetCodeOrContractId, {
        enabled: isContractId,
    });

    return {
        /** Undefined until the runtime chunk is in; every check below reads as `false` until then. */
        validators: validators.data,
        isAssetCodeValid: validators.data?.isValidAssetCode(assetCodeOrContractId) ?? false,
        isContractId,
        /** Nothing can be judged about the value yet. */
        isLoading: validators.isLoading || tokenMetadata.isLoading,
        isResolvingContractId: isContractId && contractAsset.isPending,
        /** The classic asset a Stellar Asset Contract id wraps. */
        resolvedAsset: contractAsset.data ?? undefined,
        // A contract id the definitions do not list is a native Soroban token, and so is one we
        // failed to look up: either way there is no classic asset with an issuer behind it.
        isUnknownContractId: isContractId && (contractAsset.isError || contractAsset.data === null),
    };
};
