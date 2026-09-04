import { type NetworkSymbol, asNetworkSymbol } from './types';
import { getNetworkFeatures } from './utils';

export const EARN_YIELD_CLAIM_PROVIDER = 'Merkl.xyz';

const MERKL_XYZ_CONTRACT: Record<NetworkSymbol, `0x${string}`> = {
    [asNetworkSymbol('eth')]: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    [asNetworkSymbol('arb')]: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    [asNetworkSymbol('base')]: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    [asNetworkSymbol('op')]: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
};

export const isEarnYieldClaimSupported = (
    networkSymbol: NetworkSymbol,
    { isDebugMode = false }: { isDebugMode?: boolean } = {},
) => {
    const hasClaimContract = MERKL_XYZ_CONTRACT[networkSymbol] !== undefined;

    if (isDebugMode) {
        return hasClaimContract;
    }

    return hasClaimContract && getNetworkFeatures(networkSymbol).includes('claim-rewards');
};

export const getEarnYieldClaimContractAddress = (networkSymbol: NetworkSymbol) =>
    MERKL_XYZ_CONTRACT[networkSymbol];
