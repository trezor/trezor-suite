import { createContext, useContext, useState, useEffect } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
import { BuyTrade } from 'invity-api';
import { processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import * as coinmarketCommonActions from '@wallet-actions/coinmarketCommonActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as routerActions from '@suite-actions/routerActions';
import { createQuoteLink, createTxLink } from '@suite/utils/wallet/coinmarket/buyUtils';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyOffers';
import * as notificationActions from '@suite-actions/notificationActions';
import { isDesktop } from '@suite-utils/env';

export const useOffers = (props: Props) => {
    const REFETCH_INTERVAL = 30000;
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
    const [selectedQuote, setSelectedQuote] = useState<BuyTrade>();
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[]>(quotes);
    const [innerAlternativeQuotes, setInnerAlternativeQuotes] = useState<BuyTrade[] | undefined>(
        alternativeQuotes,
    );
    const [lastFetchDate, setLastFetchDate] = useState(new Date());
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
        verifyAddress: coinmarketCommonActions.verifyAddress,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
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
            }
        };

        if (isFromRedirect && quotesRequest) {
            getQuotes();
            setIsFromRedirect(false);
        }

        const interval = setInterval(() => {
            getQuotes();
            setLastFetchDate(new Date());
        }, REFETCH_INTERVAL);

        return () => clearInterval(interval);
    });

    const selectQuote = async (quote: BuyTrade) => {
        const provider = providersInfo && quote.exchange ? providersInfo[quote.exchange] : null;
        if (quotesRequest) {
            const result = await openCoinmarketBuyConfirmModal(provider?.companyName);
            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId) {
                    const response = await invityAPI.doBuyTrade({
                        trade: quote,
                        returnUrl: createQuoteLink(quotesRequest, account),
                    });
                    if (response) {
                        if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                            await submitRequestForm(response.tradeForm);
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
                }
            }
        }
    };

    const goToPayment = async (address: string) => {
        if (!selectedQuote) return;

        const quote = { ...selectedQuote, receiveAddress: address };
        const response = await invityAPI.doBuyTrade({
            trade: quote,
            returnUrl: createTxLink(selectedQuote, account),
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            console.log('invalid response', response);
            addNotification({
                type: 'error',
                error: 'No response from the server',
            });
        } else if (response.trade.error) {
            console.log('response error', response.trade.error);
            addNotification({
                type: 'error',
                error: response.trade.error,
            });
        } else {
            await saveTrade(response.trade, account, new Date().toISOString());
            if (response.tradeForm) {
                await submitRequestForm(response.tradeForm);
            }
            if (isDesktop()) {
                await saveTransactionDetailId(response.trade.paymentId);
                goto('wallet-coinmarket-buy-detail', selectedAccount.params);
            }
        }
    };

    return {
        goToPayment,
        selectedQuote,
        verifyAddress,
        device,
        lastFetchDate,
        providersInfo,
        saveTrade,
        quotesRequest,
        addressVerified,
        quotes: innerQuotes,
        alternativeQuotes: innerAlternativeQuotes,
        selectQuote,
        account,
        REFETCH_INTERVAL,
    };
};

export const CoinmarketBuyOffersContext = createContext<ContextValues | null>(null);
CoinmarketBuyOffersContext.displayName = 'CoinmarketBuyOffersContext';

export const useCoinmarketBuyOffersContext = () => {
    const context = useContext(CoinmarketBuyOffersContext);
    if (context === null) throw Error('CoinmarketBuyOffersContext used without Context');
    return context;
};
