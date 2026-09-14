import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState, selectAccountTokenDecimals } from '@suite-native/tokens';

export const useAmountInputDecimals = (
    account?: Account,
    contractAddress?: TokenAddress,
): number | undefined => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const tokenDecimals = useSelector((state: TokensRootState) =>
        selectAccountTokenDecimals(state, account?.key, contractAddress),
    );

    if (contractAddress) {
        return tokenDecimals === null ? undefined : tokenDecimals;
    }

    return account?.symbol ? getNetwork(networkConfigDeps, account.symbol).decimals : undefined;
};
