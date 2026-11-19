import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { DEFAULT_BACK_NAVIGATION_ACTIONS, useOnNavigationRemove } from '@suite-native/navigation';
import { useExchangeAnalyticsStepReport } from '@suite-native/trading-analytics';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useApprovalFlow } from './useApprovalFlow';
import { useEvmApprovalFees } from './useEvmApprovalFees';

export const useExchangeRevokeStep = () => {
    const { dispatch } = useServices(injectDispatch);
    const reportToAnalytics = useExchangeAnalyticsStepReport('revoke-preview');

    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const { isReady, isConfirming, error: confirmError, confirmApproval } = useApprovalFlow();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const {
        fee,
        isLoading: isComposingFees,
        error: feeError,
        isFeeUnavailable,
    } = useEvmApprovalFees({
        approvalTypeOverride: 'ZERO',
    });

    const isLoading = isConfirming || isComposingFees;
    const error = confirmError || feeError;
    const isRevokeReady = !isLoading && !error && fee !== undefined;

    const hasConfirmedRef = useRef(false);

    useEffect(() => {
        if (hasConfirmedRef.current) {
            return;
        }

        if (!quote) {
            console.error('No quote to revoke approval');

            return;
        }

        if (!isReady) {
            return;
        }

        hasConfirmedRef.current = true;

        const quoteWithType =
            quote.approvalType === 'ZERO'
                ? quote
                : ({ ...quote, approvalType: 'ZERO' } satisfies ExchangeTrade);

        if (quote.approvalType !== 'ZERO') {
            dispatch(tradingExchangeActions.saveSelectedQuote(quoteWithType));
        }

        let isActive = true;

        confirmApproval(quoteWithType).then(response => {
            if (!isActive) {
                return;
            }

            if (response === undefined) {
                hasConfirmedRef.current = false;
            }
        });

        reportToAnalytics('visit');

        return () => {
            isActive = false;
        };
    }, [quote, isReady, dispatch, confirmApproval, reportToAnalytics]);

    useOnNavigationRemove({
        actionTypes: DEFAULT_BACK_NAVIGATION_ACTIONS,
        onRemoveAttempt: () => {
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            reportToAnalytics('cancel');
        },
    });

    return {
        quote,
        coinSymbol,
        isRevokeReady,
        isDisabled: !!error || isFeeUnavailable,
    };
};
