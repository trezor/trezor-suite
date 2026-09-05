import { type NetworkSymbol } from './types';
import { getNetworkFeatures } from './utils';

export const EARN_YIELD_CLAIM_PROVIDER = 'Merkl.xyz';

const MERKL_XYZ_CONTRACT: Partial<Record<NetworkSymbol, `0x${string}`>> = {
    eth: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    arb: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    base: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    op: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
};
type IsEarnYieldClaimSupportedParams = { isDebugMode?: boolean };

export const isEarnYieldClaimSupported = (
    networkSymbol: NetworkSymbol,
    { isDebugMode = false }: IsEarnYieldClaimSupportedParams = {},
) => {
    const hasClaimContract = MERKL_XYZ_CONTRACT[networkSymbol] !== undefined;

    if (isDebugMode) {
        return hasClaimContract;
    }

    return hasClaimContract && getNetworkFeatures(networkSymbol).includes('claim-rewards');
};

export const getEarnYieldClaimContractAddress = (networkSymbol: NetworkSymbol) =>
    MERKL_XYZ_CONTRACT[networkSymbol];
