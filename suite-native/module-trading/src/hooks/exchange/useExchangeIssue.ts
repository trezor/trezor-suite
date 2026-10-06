import { useSelector } from 'react-redux';

import { useExchangeIssue as useCommonExchangeIssue } from '@suite-common/trading';
import {
    selectExchangeSelectedSendAccount,
    selectIsTradingTxSimulationEnabled,
} from '@suite-native/trading-state';

import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';

export const useExchangeIssue = () => {
    const isFeatureEnabled = useSelector(selectIsTradingTxSimulationEnabled);
    const account = useSelector(selectExchangeSelectedSendAccount);

    return useCommonExchangeIssue({
        account,
        isEnabled: isFeatureEnabled,
        sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
    });
};
