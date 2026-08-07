import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type TokensRootState, selectAccountTokenDecimals } from '@suite-native/tokens';

export const useAmountInputDecimals = (
    account?: Account,
    contractAddress?: TokenAddress,
): number | undefined => {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const tokenDecimals = useSelector((state: TokensRootState) =>
        selectAccountTokenDecimals(state, account?.key, contractAddress),
    );

    if (contractAddress) {
        return tokenDecimals === null ? undefined : tokenDecimals;
    }

    return account?.symbol ? getNetworkConfig(account.symbol).decimals : undefined;
};
