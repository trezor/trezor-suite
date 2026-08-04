import { useServices } from '@suite-common/dependency-injection';
import { type TradingType, selectSelectedTradingAsset } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';

export const useSelectedTradingAsset = (tradingType: TradingType) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    return useSelector(state => selectSelectedTradingAsset(state, tradingType, networkConfigDeps));
};
