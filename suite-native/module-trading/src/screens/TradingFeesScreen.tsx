import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    StackProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { useSubscribeForSolanaBlockUpdates } from '@suite-native/transaction-management';

import { TradingFeesForm } from '../components/fees/TradingFeesForm';
import { useTradingAnalyticReportCallback } from '../hooks/general/useTradingAnalyticReportCallback';

type RouteProps = StackProps<TradingStackParamList, TradingStackRoutes.TradingFees>['route'];

export const TradingFeesScreen = () => {
    const {
        params: { accountKey, tradingType = 'exchange' },
    } = useRoute<RouteProps>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const reportToAnalytics = useTradingAnalyticReportCallback(tradingType);

    useEffect(() => {
        reportToAnalytics('fee-selection', 'visit');
    }, [reportToAnalytics]);

    useSubscribeForSolanaBlockUpdates(account);

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradingFeesScreen.title" />}
                    closeActionType="back"
                />
            }
        >
            {account && <TradingFeesForm accountKey={accountKey} />}
        </Screen>
    );
};
