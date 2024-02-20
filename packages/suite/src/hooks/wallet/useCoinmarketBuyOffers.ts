import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { BuyTrade } from 'invity-api';

import { useTimer } from '@trezor/react-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isDesktop } from '@trezor/env-utils';
import { selectDevice } from '@suite-common/wallet-core';

import invityAPI from 'src/services/suite/invityAPI';
import { useActions, useSelector, useDevice } from 'src/hooks/suite';
import { processQuotes, createQuoteLink, createTxLink } from 'src/utils/wallet/coinmarket/buyUtils';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { UseOffersProps, ContextValues } from 'src/types/wallet/coinmarketBuyOffers';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';

export const useOffers = ({ selectedAccount }: UseOffersProps) => {
    const timer = useTimer();

    const { account } = selectedAccount;
    const { isLocked } = useDevice();
    const [callInProgress, setCallInProgress] = useState<boolean>(isLocked || false);
    const [selectedQuote, setSelectedQuote] = useState<BuyTrade>();
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

    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    const device = useSelector(selectDevice);
    const { addressVerified, alternativeQuotes, buyInfo, isFromRedirect, quotes, quotesRequest } =
        useSelector(state => state.wallet.coinmarket.buy);

    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(quotes);
    const [innerAlternativeQuotes, setInnerAlternativeQuotes] = useState<BuyTrade[] | undefined>(
        alternativeQuotes,
    );
    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }

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
                const [quotes, alternativeQuotes] = processQuotes(allQuotes);
                setInnerQuotes(quotes);
                setInnerAlternativeQuotes(alternativeQuotes);
            } else {
                setInnerQuotes(undefined);
                setInnerAlternativeQuotes(undefined);
            }
            timer.reset();
        }
    }, [account.descriptor, quotesRequest, selectedQuote, timer]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToBuyForm();

            return;
        }

        if (isFromRedirect && quotesRequest) {
            getQuotes();
            setIsFromRedirect(false);
        }

        if (!timer.isLoading && !timer.isStopped) {
            if (timer.resetCount >= 40) {
                timer.stop();
            }

            if (timer.timeSpend.seconds === InvityAPIReloadQuotesAfterSeconds) {
                getQuotes();
            }
        }
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
        quotes: innerQuotes,
        alternativeQuotes: innerAlternativeQuotes,
        selectQuote,
        account,
        timer,
        getQuotes,
    };
};

export const CoinmarketBuyOffersContext = createContext<ContextValues | null>(null);
CoinmarketBuyOffersContext.displayName = 'CoinmarketBuyOffersContext';

export const useCoinmarketBuyOffersContext = () => {
    const context = useContext(CoinmarketBuyOffersContext);
    if (context === null) throw Error('CoinmarketBuyOffersContext used without Context');

    return context;
};
