import { type LegacyNetworkSymbol } from '@suite-common/legacy-network-config';

import { type NetworkSymbol } from './networkTypes';
import { getNetworkFeatures } from './utils';

export const EARN_YIELD_CLAIM_PROVIDER = 'Merkl.xyz';

// Keyed by the networks the legacy config defines, so a typo in a key is still caught.
const MERKL_XYZ_CONTRACT: Partial<Record<LegacyNetworkSymbol, `0x${string}`>> = {
    eth: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    arb: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    base: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    op: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
};

export const isEarnYieldClaimSupported = (
    networkSymbol: NetworkSymbol,
    { isDebugMode = false }: { isDebugMode?: boolean } = {},
) => {
    const hasClaimContract = MERKL_XYZ_CONTRACT[networkSymbol as LegacyNetworkSymbol] !== undefined;

    if (isDebugMode) {
        return hasClaimContract;
    }

    return hasClaimContract && getNetworkFeatures(networkSymbol).includes('claim-rewards');
};

export const getEarnYieldClaimContractAddress = (networkSymbol: NetworkSymbol) =>
    MERKL_XYZ_CONTRACT[networkSymbol as LegacyNetworkSymbol];
