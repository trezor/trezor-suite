import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
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
import { getUnusedAddressFromAccount } from '@suite/utils/wallet/coinmarket/coinmarketUtils';
import type { TradeSell } from '@suite/types/wallet/coinmarketCommonTypes';

export const useOffers = (props: Props) => {
    const timer = useTimer();
    const { selectedAccount, quotesRequest, alternativeQuotes, quotes, device } = props;

    const { account } = selectedAccount;
    const [callInProgress, setCallInProgress] = useState<boolean>(false);
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

    const { isFromRedirect, sellInfo, savedTransactionId, trades, invityServerEnvironment } = useSelector(
        state => ({
            isFromRedirect: state.wallet.coinmarket.sell.isFromRedirect,
            sellInfo: state.wallet.coinmarket.sell.sellInfo,
            savedTransactionId: state.wallet.coinmarket.sell.transactionId,
            trades: state.wallet.coinmarket.trades,
            invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
        }),
    );
    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
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

    const trade = trades.find(
        trade => trade.tradeType === 'sell' && trade.key === savedTransactionId,
    ) as TradeSell;

    useEffect(() => {
        if (!quotesRequest) {
            navigateToSellForm();
            return;
        }

        if (isFromRedirect) {
            if (savedTransactionId && trade) {
                setSelectedQuote(trade.data);
                setSellStep('SEND_TRANSACTION');
            } else {
                getQuotes();
            }

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
    }, [
        quotesRequest,
        isFromRedirect,
        timer,
        navigateToSellForm,
        savedTransactionId,
        setIsFromRedirect,
        getQuotes,
        trades,
        trade,
    ]);

    const doSellTrade = async (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : undefined;
        if (!quotesRequest || !provider) return;
        setCallInProgress(true);
        // orderId is part of the quote link if redirect to payment gate with a concrete quote
        // without the orderId the return link will point to offers
        const orderId = provider.flow === 'PAYMENT_GATE' ? quote.orderId : undefined;
        const returnUrl = await createQuoteLink(
            quotesRequest,
            account,
            { selectedFee, composed },
            orderId,
        );
        const response = await invityAPI.doSellTrade({
            trade: { ...quote, refundAddress: getUnusedAddressFromAccount(account).address },
            returnUrl,
        });
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
                response.trade.status === 'SITE_ACTION_REQUEST' ||
                (response.trade.status === 'SUBMITTED' && provider.flow === 'PAYMENT_GATE')
            ) {
                if (provider.flow === 'PAYMENT_GATE') {
                    await saveTrade(response.trade, account, new Date().toISOString());
                    await saveTransactionId(response.trade.orderId);
                    setSelectedQuote(response.trade);
                    setSellStep('SEND_TRANSACTION');
                }
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

    const needToRegisterOrVerifyBankAccount = (quote: SellFiatTrade) => {
        const provider =
            sellInfo?.providerInfos && quote.exchange
                ? sellInfo.providerInfos[quote.exchange]
                : null;
        // for BANK_ACCOUNT flow a message is shown if bank account is not verified
        if (provider?.flow === 'BANK_ACCOUNT') {
            return (
                !!quote.quoteId && !(quote.bankAccounts && quote.bankAccounts.some(b => b.verified))
            );
        }
        return false;
    };

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
        // destinationAddress may be set by useWatchSellTrade hook to the trade object
        const destinationAddress =
            selectedQuote?.destinationAddress || trade?.data?.destinationAddress;
        if (
            selectedQuote &&
            selectedQuote.orderId &&
            destinationAddress &&
            selectedQuote.cryptoStringAmount
        ) {
            const result = await recomposeAndSign(
                selectedAccount,
                destinationAddress,
                selectedQuote.cryptoStringAmount,
            );
            if (result?.success) {
                // send txid to the server as confirmation
                const { txid } = result.payload;
                const quote: SellFiatTrade = {
                    ...selectedQuote,
                    txid,
                    destinationAddress,
                    destinationPaymentExtraId:
                        selectedQuote?.destinationPaymentExtraId ||
                        trade?.data?.destinationPaymentExtraId,
                };
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
                    params: {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    },
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
        trade,
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
