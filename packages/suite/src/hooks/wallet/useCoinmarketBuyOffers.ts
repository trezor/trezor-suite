import { createContext, useContext, useState, useEffect } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions } from '@suite-hooks';
import { BuyTrade } from 'invity-api';
import { processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import * as coinmarketCommonActions from '@wallet-actions/coinmarketCommonActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import {
    createQuoteLink,
    submitRequestForm,
    createTxLink,
} from '@suite/utils/wallet/coinmarket/buyUtils';
import { Props, ContextValues } from '@wallet-types/coinmarketBuyOffers';

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
    const [selectedQuote, setSelectQuote] = useState<BuyTrade>();
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[]>(quotes);
    const [innerAlternativeQuotes, setInnerAlternativeQuotes] = useState<BuyTrade[] | undefined>(
        alternativeQuotes,
    );
    const [lastFetchDate, setLastFetchDate] = useState(new Date());
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const { goto } = useActions({ goto: routerActions.goto });
    const { verifyAddress } = useActions({ verifyAddress: coinmarketCommonActions.verifyAddress });
    const { saveTrade, setIsFromRedirect } = useActions({
        saveTrade: coinmarketBuyActions.saveTrade,
        setIsFromRedirect: coinmarketBuyActions.setIsFromRedirect,
    });

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

    const selectQuote = (quote: BuyTrade) => {
        if (quotesRequest) {
            openModal({
                type: 'coinmarket-confirm-terms',
                onConfirm: async () => {
                    // empty quoteId means the partner requests login first, requestTrade to get login screen
                    if (!quote.quoteId) {
                        const response = await invityAPI.doBuyTrade({
                            trade: quote,
                            returnUrl: createQuoteLink(quotesRequest, account),
                        });
                        // TODO - finish error handling - probably use modal to show the error to the user
                        if (response) {
                            if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                                submitRequestForm(response.tradeForm);
                            } else {
                                const errorMessage = `[doBuyTrade] ${response.trade.status} ${response.trade.error}`;
                                console.log(errorMessage);
                            }
                        } else {
                            const errorMessage = '[doBuyTrade] no response from the server';
                            console.log(errorMessage);
                        }
                    } else {
                        setSelectQuote(quote);
                    }
                },
            });
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
            // TODO - show error, something really bad happened
            console.log('invalid response', response);
        } else if (response.trade.error) {
            // TODO - show error, trade failed, typically timeout
            console.log('response error', response.trade.error);
        } else {
            await saveTrade(response.trade, account, new Date().toISOString());
            // eslint-disable-next-line no-lonely-if
            if (response.tradeForm) {
                submitRequestForm(response.tradeForm);
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
        setSelectQuote,
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
