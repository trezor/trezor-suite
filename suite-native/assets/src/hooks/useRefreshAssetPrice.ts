import { useSelector } from 'react-redux';

import { type AssetsRootState, selectAssetTokenInfo } from '@suite-common/assets';
import { commonQueryKeys, useQueryClient } from '@suite-common/react-query';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, updateFiatRatesThunk } from '@suite-common/wallet-core';
import { asTimestamp } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getAssetTicker } from '../utils/getAssetTicker';

type UseRefreshAssetPriceParams = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const useRefreshAssetPrice = ({
    networkSymbol,
    tokenContract,
}: UseRefreshAssetPriceParams) => {
    const { dispatch } = useServices(injectDispatch);
    const queryClient = useQueryClient();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const token = useSelector((state: AssetsRootState) =>
        selectAssetTokenInfo(state, networkSymbol, tokenContract),
    );

    return () =>
        Promise.allSettled([
            dispatch(
                updateFiatRatesThunk({
                    tickers: [
                        getAssetTicker({
                            networkSymbol,
                            tokenContract,
                            isErc4626Token: isErc4626(token),
                        }),
                    ],
                    baseCurrencyCode,
                    rateType: 'current',
                    fetchAttemptTimestamp: asTimestamp(Date.now()),
                }),
            ),
            queryClient.refetchQueries({
                queryKey: commonQueryKeys.assetPriceHistory(networkSymbol, tokenContract),
                type: 'active',
            }),
        ]);
};
