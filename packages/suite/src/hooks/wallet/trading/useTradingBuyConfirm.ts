import { useEffect } from 'react';

import type { BuyTrade, BuyTradeResponse } from 'invity-api';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
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

import { submitRequestFormThunk } from 'src/actions/wallet/trading/tradingCommonActions';
import { useSelector } from 'src/hooks/suite';
import { createTxLink } from 'src/utils/wallet/trading/buyUtils';

export const useTradingBuyConfirm = () => {
    const { desktopApi, analytics, dispatch } = useServices(
        injectDesktopApi,
        injectDesktopAnalytics,
        injectDispatch,
    );

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
            dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));
        }
    }, [isReady, dispatch]);

    const confirmTrade = async (): Promise<BuyTrade | undefined> => {
        if (!account || !receiveAddress || !selectedQuote) return;

        const tradeAccount = receiveAccount ?? account;
        const returnUrl = await createTxLink({ desktopApi }, selectedQuote, tradeAccount);

        const processResponseData = (response: BuyTradeResponse) => {
            if (response.tradeForm) {
                dispatch(submitRequestFormThunk(response.tradeForm.form));
            }
            if (isDesktop()) {
                if (response.trade.paymentId) {
                    dispatch(tradingBuyActions.saveTransactionId(response.trade.paymentId));
                }
                dispatch(gotoThunk({ routeName: 'wallet-trading-buy-detail' }));
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
