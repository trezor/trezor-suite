import { useSelector } from 'react-redux';

import { useDexExchangeTxSimulation as useCommonDexExchangeTxSimulation } from '@suite-common/trading';
import {
    selectExchangeSelectedSendAccount,
    selectIsTradingTxSimulationEnabled,
} from '@suite-native/trading-state';

import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';

export const useDexExchangeTxSimulation = () => {
    const isFeatureEnabled = useSelector(selectIsTradingTxSimulationEnabled);
    const account = useSelector(selectExchangeSelectedSendAccount);

    return useCommonDexExchangeTxSimulation({
        account,
        isEnabled: isFeatureEnabled,
        sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
    });
};
