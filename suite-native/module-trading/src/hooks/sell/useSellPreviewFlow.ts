import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectTradingSellIsLoading, selectTradingSellSelectedQuote } from '@suite-common/trading';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.TradingSellPreview>;

export const useSellPreviewFlow = () => {
    const navigation = useNavigation<NavigationProp>();
    const quote = useSelector(selectTradingSellSelectedQuote);
    const sendAccount = useSelector(selectSellSelectedSendAccount);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const reportToAnalytics = useSellAnalyticReportCallback();

    const canProceed = !!quote && !!sendAccount && !isLoading;

    const continueToProvider = useCallback(() => {
        if (!canProceed) {
            return;
        }

        reportToAnalytics('transaction-preview', 'continue');
        navigation.replace(RootStackRoutes.TradingSellCompletion);
    }, [canProceed, navigation, reportToAnalytics]);

    return {
        canProceed,
        isLoading,
        continueToProvider,
    };
};
