import { useSelector } from 'react-redux';

import { useDexSwapTxSimulation as useCommonDexSwapTxSimulation } from '@suite-common/trading';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';

export const useDexSwapTxSimulation = () => {
    const isFeatureEnabled = useFeatureFlag(FeatureFlag.IsTradingTxSimulationEnabled);
    const account = useSelector(selectExchangeSelectedSendAccount);

    return useCommonDexSwapTxSimulation({
        account,
        isEnabled: isFeatureEnabled,
        sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
    });
};
