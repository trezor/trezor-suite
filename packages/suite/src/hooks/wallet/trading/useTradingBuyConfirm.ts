import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { BuyTrade, BuyTradeResponse } from 'invity-api';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { injectDesktopApi } from '@suite/desktop-app-api';
import { gotoThunk } from '@suite/router';
import {
    type TradingRootState,
    buyThunks,
    selectTradingAccountKeyByTradeType,
    selectTradingBuyExtraField,
    selectTradingBuyIsLoading,
    selectTradingBuyReceiveAccount,
    selectTradingBuyReceiveAddress,
    selectTradingBuySelectedQuote,
    tradingBuyActions,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { isDesktop } from '@trezor/env-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { submitRequestFormThunk } from 'src/actions/wallet/trading/tradingCommonActions';
import { createTxLink } from 'src/utils/wallet/trading/buyUtils';

export const useTradingBuyConfirm = () => {
    const { desktopApi, analytics, dispatch } = useServices(
        injectDesktopApi,
        injectDesktopAnalytics,
        injectDispatch,
    );

    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const receiveAddress = useSelector(selectTradingBuyReceiveAddress);
    const extraField = useSelector(selectTradingBuyExtraField);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const accountKey = useSelector((state: TradingRootState) =>
        selectTradingAccountKeyByTradeType(state, 'buy'),
    );
    const account = useSelector(
        (state: AccountsRootState) => selectAccountByKey(state, accountKey) ?? undefined,
    );
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
                extraField,
                returnUrl,
                account: tradeAccount,
                processResponseData,
                triggerAnalyticsTradeConfirmation,
            }),
        ).unwrap();
    };

    return { confirmTrade, isConfirmDisabled };
};
