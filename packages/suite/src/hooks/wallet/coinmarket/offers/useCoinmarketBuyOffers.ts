import { useState, useEffect, useCallback } from 'react';
import { BuyTrade } from 'invity-api';

import { notificationsActions } from '@suite-common/toast-notifications';
import { isDesktop } from '@trezor/env-utils';

import invityAPI from 'src/services/suite/invityAPI';
import { useActions, useSelector } from 'src/hooks/suite';
import { createQuoteLink, createTxLink } from 'src/utils/wallet/coinmarket/buyUtils';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useCoinmarketFilterReducer } from '../../../../reducers/wallet/useCoinmarketFilterReducer';
import { getFilteredSuccessQuotes, useCoinmarketCommonOffers } from './useCoinmarketCommonOffers';
import { CoinmarketTradeBuyType, UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { processSellAndBuyQuotes } from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const useCoinmarketBuyOffers = ({ selectedAccount }: UseCoinmarketProps) => {
    const {
        callInProgress,
        account,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    } = useCoinmarketCommonOffers<CoinmarketTradeBuyType>({ selectedAccount });
    const { navigateToBuyForm } = useCoinmarketNavigation(account);
    const {
        saveTrade,
        setIsFromRedirect,
        openCoinmarketBuyConfirmModal,
        addNotification,
        saveTransactionDetailId,
        verifyAddress,
        submitRequestForm,
        goto,
    } = useActions({
        saveTrade: coinmarketBuyActions.saveTrade,
        setIsFromRedirect: coinmarketBuyActions.setIsFromRedirect,
        openCoinmarketBuyConfirmModal: coinmarketBuyActions.openCoinmarketBuyConfirmModal,
        addNotification: notificationsActions.addToast,
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        verifyAddress: coinmarketBuyActions.verifyAddress,
        goto: routerActions.goto,
    });

    const { addressVerified, buyInfo, isFromRedirect, quotes, quotesRequest } = useSelector(
        state => state.wallet.coinmarket.buy,
    );

    const innerQuotesFilterReducer = useCoinmarketFilterReducer<CoinmarketTradeBuyType>(quotes);
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(
        getFilteredSuccessQuotes<CoinmarketTradeBuyType>(quotes),
    );

    const getQuotes = useCallback(async () => {
        if (!selectedQuote && quotesRequest) {
            timer.loading();
            invityAPI.createInvityAPIKey(account.descriptor);
            const allQuotes = await invityAPI.getBuyQuotes(quotesRequest);
            if (Array.isArray(allQuotes)) {
                if (allQuotes.length === 0) {
                    timer.stop();

                    return;
                }
                const quotes = processSellAndBuyQuotes<CoinmarketTradeBuyType>(allQuotes);
                const successQuotes = getFilteredSuccessQuotes<CoinmarketTradeBuyType>(quotes);
                setInnerQuotes(successQuotes);
                innerQuotesFilterReducer.dispatch({
                    type: 'FILTER_SET_PAYMENT_METHODS',
                    payload: successQuotes ?? [],
                });
            } else {
                setInnerQuotes(undefined);
            }
            timer.reset();
        }
    }, [selectedQuote, quotesRequest, timer, account.descriptor, innerQuotesFilterReducer]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToBuyForm();

            return;
        }

        if (isFromRedirect && quotesRequest) {
            getQuotes();
            setIsFromRedirect(false);
        }

        checkQuotesTimer(getQuotes);
    });

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;
        if (quotesRequest) {
            const result = await openCoinmarketBuyConfirmModal(
                provider?.companyName,
                quote.receiveCurrency,
            );
            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId) {
                    const returnUrl = await createQuoteLink(quotesRequest, account);
                    const response = await invityAPI.doBuyTrade({ trade: quote, returnUrl });
                    if (response) {
                        if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                            submitRequestForm(response.tradeForm.form);
                        } else {
                            const errorMessage = `[doBuyTrade] ${response.trade.status} ${response.trade.error}`;
                            console.log(errorMessage);
                        }
                    } else {
                        const errorMessage = 'No response from the server';
                        console.log(`[doBuyTrade] ${errorMessage}`);
                        addNotification({
                            type: 'error',
                            error: errorMessage,
                        });
                    }
                } else {
                    setSelectedQuote(quote);
                    timer.stop();
                }
            }
        }
    };

    const goToPayment = async (address: string) => {
        setCallInProgress(true);
        if (!selectedQuote) return;

        const returnUrl = await createTxLink(selectedQuote, account);
        const quote = { ...selectedQuote, receiveAddress: address };
        const response = await invityAPI.doBuyTrade({
            trade: quote,
            returnUrl,
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            addNotification({
                type: 'error',
                error: 'No response from the server',
            });
        } else if (response.trade.error) {
            addNotification({
                type: 'error',
                error: response.trade.error,
            });
        } else {
            saveTrade(response.trade, account, new Date().toISOString());
            if (response.tradeForm) {
                submitRequestForm(response.tradeForm.form);
            }
            if (isDesktop()) {
                saveTransactionDetailId(response.trade.paymentId);
                goto('wallet-coinmarket-buy-detail', { params: selectedAccount.params });
            }
        }
        setCallInProgress(false);
    };

    return {
        goToPayment,
        callInProgress,
        selectedQuote,
        verifyAddress,
        device,
        providersInfo: buyInfo?.providerInfos,
        quotesRequest,
        addressVerified,
        quotes: innerQuotesFilterReducer.actions.handleFilterQuotes(innerQuotes),
        innerQuotesFilterReducer,
        selectQuote,
        account,
        timer,
        getQuotes,
        type: 'buy' as const,
    };
};
