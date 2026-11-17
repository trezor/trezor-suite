import { useTokenMetadata } from '@suite-common/token';
import { getNetwork } from '@suite-common/wallet-config';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';

/** A token's decimals from its metadata; the native coin has the network's. */
export const useYieldTokenDecimals = ({
    networkSymbol,
    contractAddress,
}: YieldFlowDisplayToken) => {
    const token = useTokenMetadata(networkSymbol, contractAddress);

    return contractAddress ? token?.decimals : getNetwork(networkSymbol).decimals;
};
