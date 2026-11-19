import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

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

type UseExchangeApprovalStepParams = {
    isRevoked: boolean | undefined;
};

export const useExchangeApprovalStep = ({ isRevoked }: UseExchangeApprovalStepParams) => {
    const { dispatch } = useServices(injectDispatch);
    const reportToAnalytics = useExchangeAnalyticsStepReport('approval-preview');

    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const {
        isReady,
        isConfirming,
        error: confirmError,
        confirmApproval,
        onApprovalTypeChange,
    } = useApprovalFlow();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const {
        fee,
        isLoading: isComposingFees,
        error: feeError,
        isFeeUnavailable,
    } = useEvmApprovalFees();

    const isLoading = isConfirming || isComposingFees;
    const error = confirmError || feeError;
    const isApprovalReady = !isLoading && !error && fee !== undefined;

    const hasConfirmedRef = useRef(false);

    useEffect(() => {
        if (hasConfirmedRef.current) {
            return;
        }

        if (!quote) {
            console.error('No quote to confirm approval');

            return;
        }

        if (!isReady) {
            return;
        }

        hasConfirmedRef.current = true;

        // When arriving from a revoke-and-approve flow the quote still carries approvalType: 'ZERO'
        // from the revoke step. Reset it to 'MINIMAL' so we sign an approval, not another revoke.
        const needsTypeReset = !quote.approvalType || isRevoked;
        const quoteWithType = needsTypeReset
            ? ({ ...quote, approvalType: 'MINIMAL' } satisfies ExchangeTrade)
            : quote;

        if (needsTypeReset) {
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
    }, [quote, isReady, isRevoked, dispatch, confirmApproval, reportToAnalytics]);

    useOnNavigationRemove({
        actionTypes: DEFAULT_BACK_NAVIGATION_ACTIONS,
        onRemoveAttempt: () => {
            dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            reportToAnalytics('cancel');
        },
    });

    const onApprovalTypeChangeWithAnalytics = (approvalType: DexApprovalType) => {
        onApprovalTypeChange(approvalType);
        reportToAnalytics(`value_change`);
    };

    return {
        quote,
        coinSymbol,
        isApprovalReady,
        isDisabled: !!error || isFeeUnavailable,
        onApprovalTypeChange: onApprovalTypeChangeWithAnalytics,
    };
};
