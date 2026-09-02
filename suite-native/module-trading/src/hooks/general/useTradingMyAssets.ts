import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import { type TradingType } from '@suite-common/trading';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '@suite-native/trading-state';

export const useTradingMyAssets = (tradingType: TradingType) => {
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);
    const supportedNetworks = networkModuleRepository.getSupportedNetworks();

    return useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(
            state,
            tradingType,
            supportedNetworks,
        ),
    );
};
