import { createContext, useContext, useState, useEffect } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector, useDevice } from '@suite-hooks';
import { useTimer } from '@suite-hooks/useTimeInterval';
import { BuyTrade } from 'invity-api';
import { processQuotes, createQuoteLink, createTxLink } from '@wallet-utils/coinmarket/buyUtils';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as routerActions from '@suite-actions/routerActions';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyOffers';
import * as notificationActions from '@suite-actions/notificationActions';
import { isDesktop } from '@suite-utils/env';

export const useOffers = (props: Props) => {
    const timer = useTimer();
    const REFETCH_INTERVAL_IN_SECONDS = 30;
    const {
        selectedAccount,
        quotesRequest,
        alternativeQuotes,
        quotes,
        providersInfo,
        device,
        addressVerified,
        isFromRedirect,
    } = props;

    const { account } = selectedAccount;
    const { isLocked } = useDevice();
    const [callInProgress, setCallInProgress] = useState<boolean>(isLocked || false);
    const [selectedQuote, setSelectedQuote] = useState<BuyTrade>();
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[]>(quotes);
    const [innerAlternativeQuotes, setInnerAlternativeQuotes] = useState<BuyTrade[] | undefined>(
        alternativeQuotes,
    );
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
        addNotification: notificationActions.addToast,
        saveTransactionDetailId: coinmarketBuyActions.saveTransactionDetailId,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        verifyAddress: coinmarketCommonActions.verifyAddress,
        goto: routerActions.goto,
    });

    const invityAPIUrl = useSelector(state => state.suite.settings.debug.invityAPIUrl);
    if (invityAPIUrl) {
        invityAPI.setInvityAPIServer(invityAPIUrl);
    }

    useEffect(() => {
        if (!quotesRequest) {
            goto('wallet-coinmarket-buy', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            });
            return;
        }

        const getQuotes = async () => {
            if (!selectedQuote) {
                invityAPI.createInvityAPIKey(account.descriptor);
                const allQuotes = await invityAPI.getBuyQuotes(quotesRequest);
                const [quotes, alternativeQuotes] = processQuotes(allQuotes);
                setInnerQuotes(quotes);
                setInnerAlternativeQuotes(alternativeQuotes);
                timer.reset();
            }
        };

        if (isFromRedirect && quotesRequest) {
            getQuotes();
            setIsFromRedirect(false);
        }

        if (!timer.isLoading && !timer.isStopped) {
            if (timer.resetCount >= 40) {
                timer.stop();
            }

            if (timer.timeSpend.seconds === REFETCH_INTERVAL_IN_SECONDS) {
                timer.loading();
                getQuotes();
            }
        }
    });

    const selectQuote = async (quote: BuyTrade) => {
        const provider = providersInfo && quote.exchange ? providersInfo[quote.exchange] : null;
        if (quotesRequest) {
            const result = await openCoinmarketBuyConfirmModal(provider?.companyName);
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
                goto('wallet-coinmarket-buy-detail', selectedAccount.params);
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
        providersInfo,
        saveTrade,
        quotesRequest,
        addressVerified,
        quotes: innerQuotes,
        alternativeQuotes: innerAlternativeQuotes,
        selectQuote,
        account,
        REFETCH_INTERVAL_IN_SECONDS,
        timer,
    };
};

export const CoinmarketBuyOffersContext = createContext<ContextValues | null>(null);
CoinmarketBuyOffersContext.displayName = 'CoinmarketBuyOffersContext';

export const useCoinmarketBuyOffersContext = () => {
    const context = useContext(CoinmarketBuyOffersContext);
    if (context === null) throw Error('CoinmarketBuyOffersContext used without Context');
    return context;
};
