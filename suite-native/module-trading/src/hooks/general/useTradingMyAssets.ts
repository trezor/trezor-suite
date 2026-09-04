import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetSupportedNetworksDep } from '@suite-common/networks';
import { type TradingType } from '@suite-common/trading';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '@suite-native/trading-state';

export const useTradingMyAssets = (tradingType: TradingType) => {
    const { getSupportedNetworks } = useServices(selectGetSupportedNetworksDep);
    const supportedNetworks = getSupportedNetworks();

    return useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(
            state,
            tradingType,
            supportedNetworks,
        ),
    );
};
