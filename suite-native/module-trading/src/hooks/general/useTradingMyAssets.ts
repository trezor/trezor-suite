import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkModuleRepositoryDep } from '@suite-common/networks';
import { type TradingType } from '@suite-common/trading';
import { getSupportedNetworks } from '@suite-common/wallet-config';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '@suite-native/trading-state';

export const useTradingMyAssets = (tradingType: TradingType) => {
    const allNetworkSymbols = getSupportedNetworks();
    const { networkModuleRepository } = useServices(selectNetworkModuleRepositoryDep);
    const supportedNetworks = networkModuleRepository.getSupportedNetworks();

    return useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(
            state,
            tradingType,
            supportedNetworks,
            allNetworkSymbols,
        ),
    );
};
