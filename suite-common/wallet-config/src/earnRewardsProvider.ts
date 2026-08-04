import type { GetNetworkConfigDep } from '@suite-common/networks';

import { type NetworkSymbol } from './types';

export const EARN_YIELD_CLAIM_PROVIDER = 'Merkl.xyz';

const MERKL_XYZ_CONTRACT: Partial<Record<NetworkSymbol, `0x${string}`>> = {
    eth: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    arb: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    base: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
    op: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
};

export const isEarnYieldClaimSupported = (
    deps: GetNetworkConfigDep,
    networkSymbol: NetworkSymbol,
    { isDebugMode = false }: { isDebugMode?: boolean } = {},
) => {
    const hasClaimContract = MERKL_XYZ_CONTRACT[networkSymbol] !== undefined;

    if (isDebugMode) {
        return hasClaimContract;
    }

    return (
        hasClaimContract && deps.getNetworkConfig(networkSymbol).features.includes('claim-rewards')
    );
};

export const getEarnYieldClaimContractAddress = (networkSymbol: NetworkSymbol) =>
    MERKL_XYZ_CONTRACT[networkSymbol];
