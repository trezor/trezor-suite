import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { gotoThunk } from '@suite/router';
import {
    type TradingFormAccountRootState,
    selectTradingExchangeApprovalFlow,
    selectTradingExchangeApprovalFlowSteps,
    selectTradingExchangeFormValues,
    selectTradingExchangePendingApprovalTxid,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    useTradingExchangeWatchApproval,
} from '@suite-common/trading';
import { getErc20ApproveSpender } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectExchangeQuoteThunk } from '#src/actions/wallet/trading/exchange/selectExchangeQuoteThunk';
import { useExchangeApproval } from '#src/hooks/wallet/trading/form/exchange/useExchangeApproval';

import { useResumedApproval } from './useResumedApproval';

export const useTradingExchangeApprovalFlow = () => {
    const { dispatch } = useServices(injectDispatch);
    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, 'exchange'),
    );
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const approvalFlow = useSelector(selectTradingExchangeApprovalFlow);
    const steps = useSelector(selectTradingExchangeApprovalFlowSteps);
    const formValues = useSelector(selectTradingExchangeFormValues);
    const pendingApprovalTxid = useSelector(selectTradingExchangePendingApprovalTxid);
    const { confirmApproval } = useExchangeApproval({ account });
    const resumedApproval = useResumedApproval({ quote, pendingApprovalTxid, confirmApproval });

    const quoteSpender = getErc20ApproveSpender(quote?.dexTx?.data);
    const [spender, setSpender] = useState(quoteSpender);
    if (quoteSpender && quoteSpender !== spender) {
        setSpender(quoteSpender);
    }

    const handledApprovalOrderRef = useRef<string>(undefined);

    useTradingExchangeWatchApproval({ account, isEnabled: true });

    const isFlowMissing =
        !approvalFlow || !quote?.send || !!quote.error || quote.status === 'ERROR';

    useEffect(() => {
        if (isFlowMissing) {
            dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));
        }
    }, [isFlowMissing, dispatch]);

    const isApprovalDone =
        steps.length > 0 && steps.every(({ type, status }) => type === 'swap' || status === 'done');

    useEffect(() => {
        if (
            !isApprovalDone ||
            !quote?.receiveAddress ||
            !quote.orderId ||
            handledApprovalOrderRef.current === `${quote.orderId}:${quote.status}`
        ) {
            return;
        }

        handledApprovalOrderRef.current = `${quote.orderId}:${quote.status}`;
        const { receiveAddress } = quote;

        const proceedToSwap = async () => {
            const newTrade = await confirmApproval({
                trade: { ...quote, status: 'CONFIRM', approvalType: undefined },
                receiveAddress,
            });

            if (newTrade?.status !== 'CONFIRM' && newTrade?.status !== 'SIGN_DATA') {
                return;
            }

            dispatch(
                selectExchangeQuoteThunk({
                    quote: newTrade,
                    exchangeType: formValues?.exchangeType,
                    rateType: formValues?.rateType,
                }),
            );
        };

        proceedToSwap();
    }, [isApprovalDone, quote, formValues, confirmApproval, dispatch]);

    const lastApprovalIndex = steps.findLastIndex(({ type }) => type !== 'swap');
    const displayedSteps = steps.map((step, index) => {
        const isDisplayedPending = isApprovalDone
            ? index === lastApprovalIndex
            : resumedApproval.isConfirming && step.status === 'active';

        return isDisplayedPending ? { ...step, status: 'pending' as const } : step;
    });

    return {
        account,
        quote,
        steps: displayedSteps,
        spender,
        pendingApprovalTxid: resumedApproval.txid,
        isFlowMissing,
    };
};
