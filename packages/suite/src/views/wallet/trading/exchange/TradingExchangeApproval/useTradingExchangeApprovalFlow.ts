import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { gotoThunk } from '@suite/router';
import {
    type TradingFormAccountRootState,
    selectTradingExchangeApprovalFlow,
    selectTradingExchangeApprovalFlowSteps,
    selectTradingExchangeFormValues,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
    tradingExchangeActions,
    useTradingExchangeWatchApproval,
} from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectExchangeQuoteThunk } from 'src/actions/wallet/trading/exchange/selectExchangeQuoteThunk';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';

export const useTradingExchangeApprovalFlow = () => {
    const { dispatch } = useServices(injectDispatch);
    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, 'exchange'),
    );
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const approvalFlow = useSelector(selectTradingExchangeApprovalFlow);
    const steps = useSelector(selectTradingExchangeApprovalFlowSteps);
    const formValues = useSelector(selectTradingExchangeFormValues);
    const { confirmApproval } = useExchangeApproval({ account });

    const handledRevokeTxRef = useRef<string>(undefined);
    const handledApprovalOrderRef = useRef<string>(undefined);

    useTradingExchangeWatchApproval({ account, isEnabled: true });

    const isFlowMissing =
        !approvalFlow || !quote?.send || !!quote.error || quote.status === 'ERROR';

    useEffect(() => {
        if (isFlowMissing) {
            dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));
        }
    }, [isFlowMissing, dispatch]);

    const revokeTxid =
        quote?.status === 'APPROVAL_REQ' && quote.approvalType === 'ZERO'
            ? quote.approvalSendTxHash
            : undefined;

    useEffect(() => {
        if (!quote?.receiveAddress || !revokeTxid || handledRevokeTxRef.current === revokeTxid) {
            return;
        }

        handledRevokeTxRef.current = revokeTxid;
        dispatch(tradingExchangeActions.completeApprovalFlowStep('revoke'));
        confirmApproval({
            trade: { ...quote, approvalType: 'MINIMAL', approvalSendTxHash: undefined },
            receiveAddress: quote.receiveAddress,
        });
    }, [quote, revokeTxid, confirmApproval, dispatch]);

    const isApprovalDone =
        steps.length > 0 && steps.every(({ type, status }) => type === 'swap' || status === 'done');

    useEffect(() => {
        if (
            !isApprovalDone ||
            !quote?.receiveAddress ||
            !quote.orderId ||
            handledApprovalOrderRef.current === quote.orderId
        ) {
            return;
        }

        handledApprovalOrderRef.current = quote.orderId;
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
    const displayedSteps = isApprovalDone
        ? steps.map((step, index) =>
              index === lastApprovalIndex ? { ...step, status: 'pending' as const } : step,
          )
        : steps;

    return { account, quote, steps: displayedSteps, isFlowMissing };
};
