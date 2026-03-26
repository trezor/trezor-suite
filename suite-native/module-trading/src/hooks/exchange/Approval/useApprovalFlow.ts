import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

import {
    exchangeThunks,
    selectTradingExchangeActiveQuote,
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

    const quote = useSelector(selectTradingExchangeActiveQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const receiveAddress = getReceiveAccountAddressText(toAccount);

    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirmApproval = useCallback(
        async (quoteToConfirm: ExchangeTrade) => {
            if (!sendAccount || !receiveAddress || !quoteToConfirm) {
                return undefined;
            }

            setIsConfirming(true);
            setError(null);

            try {
                const response = await dispatch(
                    exchangeThunks.confirmApprovalThunk({
                        trade: quoteToConfirm,
                        receiveAddress,
                        account: sendAccount,
                        processResponseData: () => {},
                    }),
                ).unwrap();

                if (!response) {
                    setError(translate('moduleTrading.confirmApprovalError'));

                    return undefined;
                }

                return response;
            } catch (e) {
                console.error('Failed to confirm approval trade', e);
                setError(translate('moduleTrading.confirmApprovalError'));

                return undefined;
            } finally {
                setIsConfirming(false);
            }
        },
        [dispatch, receiveAddress, sendAccount, translate],
    );

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
        onApprovalTypeChange,
    };
};
