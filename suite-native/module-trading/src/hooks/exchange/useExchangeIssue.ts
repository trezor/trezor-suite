import { useSelector } from 'react-redux';

import { useExchangeIssue as useCommonExchangeIssue } from '@suite-common/trading';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';

export const useExchangeIssue = () => {
    const isFeatureEnabled = useFeatureFlag(FeatureFlag.IsTradingTxSimulationEnabled);
    const account = useSelector(selectExchangeSelectedSendAccount);

    return useCommonExchangeIssue({
        account,
        isEnabled: isFeatureEnabled,
        sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
    });
};
