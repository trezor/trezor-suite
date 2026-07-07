import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

import {
    exchangeThunks,
    selectTradingExchangeSelectedQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '@suite-native/trading-state';

import { getReceiveAccountAddressText } from '../../../utils/general/receiveAccountUtils';

export const useApprovalFlow = () => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const receiveAddress = getReceiveAccountAddressText(toAccount);

    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inFlightConfirmApprovalRef = useRef<{ abort: (reason?: string) => void } | null>(null);

    const confirmApproval = useCallback(
        async (quoteToConfirm: ExchangeTrade) => {
            if (!sendAccount || !receiveAddress || !quoteToConfirm) {
                return undefined;
            }

            setIsConfirming(true);
            setError(null);

            try {
                const promiseAction = dispatch(
                    exchangeThunks.confirmApprovalThunk({
                        trade: quoteToConfirm,
                        receiveAddress,
                        account: sendAccount,
                        processResponseData: () => {},
                    }),
                );
                inFlightConfirmApprovalRef.current = promiseAction;

                const response = await promiseAction.unwrap();

                if (!response) {
                    setError(translate('moduleTrading.confirmApprovalError'));

                    return undefined;
                }

                return response;
            } catch (e) {
                if ((e as Error)?.name === 'AbortError') {
                    // The flow was cancelled — not an error to surface.
                    return undefined;
                }

                console.error('Failed to confirm approval trade', e);
                setError(translate('moduleTrading.confirmApprovalError'));

                return undefined;
            } finally {
                inFlightConfirmApprovalRef.current = null;
                setIsConfirming(false);
            }
        },
        [dispatch, receiveAddress, sendAccount, translate],
    );

    const abortConfirmApproval = useCallback(() => {
        inFlightConfirmApprovalRef.current?.abort();
        inFlightConfirmApprovalRef.current = null;
    }, []);

    const isReady = !!sendAccount && !!receiveAddress;

    const onApprovalTypeChange = useCallback(
        (approvalType: DexApprovalType) => {
            if (!quote) {
                return;
            }

            if (quote.approvalType === approvalType || isConfirming) {
                return;
            }

            const updatedQuote = { ...quote, approvalType };
            dispatch(tradingExchangeActions.saveSelectedQuote(updatedQuote));
            confirmApproval(updatedQuote);
        },
        [confirmApproval, dispatch, isConfirming, quote],
    );

    return {
        quote,
        isReady,
        isConfirming,
        error,
        confirmApproval,
        abortConfirmApproval,
        onApprovalTypeChange,
    };
};
