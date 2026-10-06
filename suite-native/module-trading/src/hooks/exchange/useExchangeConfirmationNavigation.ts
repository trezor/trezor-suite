import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { type ExchangeTradeStatus } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { sendFormActions } from '@suite-common/wallet-core';
import {
    type ConfirmingScreenFlowType,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';
import { exhaustive } from '@trezor/type-utils';

type ConfirmedExchangeNavigation =
    | { destination: 'initial' }
    | { destination: 'preview' }
    | { destination: 'approval'; isRevoked: boolean };

type GetConfirmedExchangeNavigationParams = {
    flowType: ConfirmingScreenFlowType;
    quoteStatus: ExchangeTradeStatus | undefined;
};

const getConfirmedExchangeNavigation = ({
    flowType,
    quoteStatus,
}: GetConfirmedExchangeNavigationParams): ConfirmedExchangeNavigation | undefined => {
    switch (flowType) {
        case 'revoke':
            return { destination: 'initial' };

        case 'approve':
        case 'revoke-and-approve':
            if (quoteStatus === 'CONFIRM') {
                return { destination: 'preview' };
            }

            if (quoteStatus === 'APPROVAL_REQ') {
                return {
                    destination: 'approval',
                    isRevoked: flowType === 'revoke-and-approve',
                };
            }

            return undefined;

        default:
            return exhaustive(flowType);
    }
};

export type UseExchangeConfirmationNavigationParams = {
    flowType: ConfirmingScreenFlowType;
    // Owned by the screen so the debug status override and this navigation share one status.
    isConfirmed: boolean;
};

export const useExchangeConfirmationNavigation = ({
    flowType,
    isConfirmed,
}: UseExchangeConfirmationNavigationParams) => {
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.TradingConfirming>
        >();
    const { dispatch } = useServices(injectDispatch);
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const reportToAnalytics = useExchangeAnalyticsStepReport(
        flowType === 'approve' ? 'approval-confirming' : 'revoke-confirming',
    );
    const hasNavigatedRef = useRef(false);

    useEffect(() => {
        if (!quote || !isConfirmed || hasNavigatedRef.current) {
            return;
        }

        const navigationTarget = getConfirmedExchangeNavigation({
            flowType,
            quoteStatus: quote.status,
        });

        if (!navigationTarget) {
            return;
        }

        hasNavigatedRef.current = true;
        dispatch(sendFormActions.dispose());

        switch (navigationTarget.destination) {
            case 'initial':
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                navigation.popToTop();
                break;

            case 'preview':
                navigation.popToTop();
                navigation.push(RootStackRoutes.TradingExchangePreview, { isApproved: true });
                break;

            case 'approval':
                dispatch(
                    tradingExchangeActions.saveSelectedQuote({
                        ...quote,
                        approvalSendTxHash: undefined,
                        approvalType: undefined,
                    }),
                );
                navigation.popToTop();
                navigation.push(RootStackRoutes.TradingExchangeApproval, {
                    isRevoked: navigationTarget.isRevoked,
                });
                break;

            default:
                return exhaustive(navigationTarget.destination);
        }

        reportToAnalytics('continue');
    }, [dispatch, flowType, isConfirmed, navigation, quote, reportToAnalytics]);
};
