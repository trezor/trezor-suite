import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import type { BuyTrade, BuyTradeResponse } from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import {
    buyThunks,
    selectTradingAccountKeyByTradeType,
    selectTradingBuyIsLoading,
    selectTradingBuyReceiveAccount,
    selectTradingBuyReceiveAddress,
    selectTradingBuySelectedQuote,
    tradingBuyActions,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';

import { submitRequestForm } from 'src/actions/wallet/trading/tradingCommonActions';
import { useSelector } from 'src/hooks/suite';
import { createTxLink } from 'src/utils/wallet/trading/buyUtils';

export const useTradingBuyConfirm = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();

    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const receiveAddress = useSelector(selectTradingBuyReceiveAddress);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const accountKey = useSelector(state => selectTradingAccountKeyByTradeType(state, 'buy'));
    const account = useSelector(state => selectAccountByKey(state, accountKey) ?? undefined);
    const receiveAccount = useSelector(selectTradingBuyReceiveAccount);

    const isReady = !!selectedQuote && !!receiveAddress && !!account;
    const isConfirmDisabled = isLoading || !selectedQuote || !receiveAddress || !account;

    useEffect(() => {
        if (!isReady) {
            dispatch(goto({ routeName: 'wallet-trading-buy' }));
        }
    }, [isReady, dispatch]);

    const confirmTrade = async (): Promise<BuyTrade | undefined> => {
        if (!account || !receiveAddress || !selectedQuote) return;

        const tradeAccount = receiveAccount ?? account;
        const returnUrl = await createTxLink(selectedQuote, tradeAccount);

        const processResponseData = (response: BuyTradeResponse) => {
            if (response.tradeForm) {
                dispatch(submitRequestForm(response.tradeForm.form));
            }
            if (isDesktop()) {
                if (response.trade.paymentId) {
                    dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
                }
                dispatch(goto({ routeName: 'wallet-trading-buy-detail' }));
            }
        };

        const triggerAnalyticsTradeConfirmation = () => {
            analytics.report({
                type: events.tradeConfirmTradeEvent.name,
                payload: { action: 'buy' },
            });
        };

        return await dispatch(
            buyThunks.confirmTradeThunk({
                quote: selectedQuote,
                address: receiveAddress,
                returnUrl,
                account: tradeAccount,
                processResponseData,
                triggerAnalyticsTradeConfirmation,
            }),
        ).unwrap();
    };

    return { confirmTrade, isConfirmDisabled };
};
