import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector, useDevice } from '@suite-hooks';
import { useTimer } from '@suite-hooks/useTimeInterval';
import { BankAccount, SellFiatTrade } from 'invity-api';
import { processQuotes, createQuoteLink } from '@wallet-utils/coinmarket/sellUtils';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import * as routerActions from '@suite-actions/routerActions';
import { Props, ContextValues, SellStep } from '@wallet-types/coinmarketSellOffers';
import * as notificationActions from '@suite-actions/notificationActions';
import { useCoinmarketRecomposeAndSign } from './useCoinmarketRecomposeAndSign ';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from '@wallet-constants/coinmarket/metadata';

export const useOffers = (props: Props) => {
    const timer = useTimer();
    const { selectedAccount, quotesRequest, alternativeQuotes, quotes, device } = props;

    const { account } = selectedAccount;
    const { isLocked } = useDevice();
    const [callInProgress, setCallInProgress] = useState<boolean>(isLocked || false);
    const [selectedQuote, setSelectedQuote] = useState<SellFiatTrade>();
    const [innerQuotes, setInnerQuotes] = useState<SellFiatTrade[] | undefined>(quotes);
    const [innerAlternativeQuotes, setInnerAlternativeQuotes] = useState<
        SellFiatTrade[] | undefined
    >(alternativeQuotes);
    const [sellStep, setSellStep] = useState<SellStep>('BANK_ACCOUNT');
    const { navigateToSellForm } = useCoinmarketNavigation(account);
    const {
        saveTrade,
        setIsFromRedirect,
        openCoinmarketSellConfirmModal,
        addNotification,
        saveTransactionId,
        submitRequestForm,
        goto,
        loadInvityData,
    } = useActions({
        saveTrade: coinmarketSellActions.saveTrade,
        setIsFromRedirect: coinmarketSellActions.setIsFromRedirect,
        openCoinmarketSellConfirmModal: coinmarketSellActions.openCoinmarketSellConfirmModal,
        addNotification: notificationActions.addToast,
        saveTransactionId: coinmarketSellActions.saveTransactionId,
        submitRequestForm: coinmarketCommonActions.submitRequestForm,
        goto: routerActions.goto,
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    loadInvityData();

    const { invityAPIUrl, isFromRedirect, sellInfo } = useSelector(state => ({
        invityAPIUrl: state.suite.settings.debug.invityAPIUrl,
        isFromRedirect: state.wallet.coinmarket.sell.isFromRedirect,
        sellInfo: state.wallet.coinmarket.sell.sellInfo,
    }));
    if (invityAPIUrl) {
        invityAPI.setInvityAPIServer(invityAPIUrl);
    }

    const { selectedFee, composed, recomposeAndSign } = useCoinmarketRecomposeAndSign();

    const getQuotes = useCallback(async () => {
        if (!selectedQuote && quotesRequest) {
            timer.loading();
            invityAPI.createInvityAPIKey(account.descriptor);
            const allQuotes = await invityAPI.getSellQuotes(quotesRequest);
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
            navigateToSellForm();
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

    const doSellTrade = async (quote: SellFiatTrade) => {
        if (!quotesRequest) return;
        setCallInProgress(true);
        const returnUrl = await createQuoteLink(quotesRequest, account, { selectedFee, composed });
        const response = await invityAPI.doSellTrade({ trade: quote, returnUrl });
        setCallInProgress(false);
        if (response) {
            if (response.trade.error) {
                console.log(`[doSellTrade] ${response.trade.error}`);
                addNotification({
                    type: 'error',
                    error: response.trade.error,
                });
                return undefined;
            }
            if (
                response.trade.status === 'LOGIN_REQUEST' ||
                response.trade.status === 'SITE_ACTION_REQUEST'
            ) {
                submitRequestForm(response.tradeForm?.form);
                return undefined;
            }
            return response.trade;
        }
        const errorMessage = 'No response from the server';
        console.log(`[doSellTrade] ${errorMessage}`);
        addNotification({
            type: 'error',
            error: errorMessage,
        });
    };

    const needToRegisterOrVerifyBankAccount = (quote: SellFiatTrade) =>
        !!quote.quoteId && !(quote.bankAccounts && quote.bankAccounts.some(b => b.verified));

    const selectQuote = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : null;
        if (quotesRequest) {
            const result = await openCoinmarketSellConfirmModal(provider?.companyName);
            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId || needToRegisterOrVerifyBankAccount(quote)) {
                    doSellTrade(quote);
                } else {
                    setSelectedQuote(quote);
                    timer.stop();
                }
            }
        }
    };

    const confirmTrade = async (bankAccount: BankAccount) => {
        if (!selectedQuote) return;
        const quote = { ...selectedQuote, bankAccount };
        const response = await doSellTrade(quote);
        if (response) {
            setSelectedQuote(response);
            setSellStep('SEND_TRANSACTION');
        }
    };

    const addBankAccount = async () => {
        if (!selectedQuote) return;
        await doSellTrade(selectedQuote);
    };

    const sendTransaction = async () => {
        if (
            selectedQuote &&
            selectedQuote.orderId &&
            selectedQuote.destinationAddress &&
            selectedQuote.cryptoStringAmount
        ) {
            const result = await recomposeAndSign(
                selectedAccount,
                selectedQuote.destinationAddress,
                selectedQuote.cryptoStringAmount,
            );
            if (result?.success) {
                // send txid to the server as confirmation
                const { txid } = result.payload;
                const quote = { ...selectedQuote, txid };
                const response = await invityAPI.doSellConfirm(quote);
                if (!response) {
                    addNotification({
                        type: 'error',
                        error: 'No response from the server',
                    });
                } else if (response.error || !response.status || !response.orderId) {
                    addNotification({
                        type: 'error',
                        error: response.error || 'Invalid response from the server',
                    });
                }

                await saveTrade(response, account, new Date().toISOString());
                await saveTransactionId(selectedQuote.orderId);

                goto('wallet-coinmarket-sell-detail', {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                });
            }
        } else {
            addNotification({
                type: 'error',
                error: 'Cannot send transaction, missing data',
            });
        }
    };

    return {
        sendTransaction,
        callInProgress,
        selectedQuote,
        device,
        saveTrade,
        confirmTrade,
        addBankAccount,
        quotesRequest,
        quotes: innerQuotes,
        alternativeQuotes: innerAlternativeQuotes,
        sellStep,
        setSellStep,
        selectQuote,
        account,
        timer,
        sellInfo,
        needToRegisterOrVerifyBankAccount,
        getQuotes,
    };
};

export const CoinmarketSellOffersContext = createContext<ContextValues | null>(null);
CoinmarketSellOffersContext.displayName = 'CoinmarketSellOffersContext';

export const useCoinmarketSellOffersContext = () => {
    const context = useContext(CoinmarketSellOffersContext);
    if (context === null) throw Error('CoinmarketSellOffersContext used without Context');
    return context;
};
