import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import type { BankAccount, SellFiatTrade } from 'invity-api';

import { useTimer } from '@trezor/react-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { amountToSatoshi } from '@suite-common/wallet-utils';
import { selectDevice } from '@suite-common/wallet-core';

import invityAPI from 'src/services/suite/invityAPI';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { processQuotes, createQuoteLink } from 'src/utils/wallet/coinmarket/sellUtils';
import {
    loadInvityData,
    submitRequestForm,
} from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import {
    openCoinmarketSellConfirmModal,
    saveTrade,
    saveTransactionId,
    setIsFromRedirect,
} from 'src/actions/wallet/coinmarketSellActions';
import { goto } from 'src/actions/suite/routerActions';
import { UseOffersProps, ContextValues, SellStep } from 'src/types/wallet/coinmarketSellOffers';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import type { TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

import { useCoinmarketRecomposeAndSign } from './useCoinmarketRecomposeAndSign';

export const useOffers = ({ selectedAccount }: UseOffersProps) => {
    const timer = useTimer();

    const { account, network } = selectedAccount;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const [callInProgress, setCallInProgress] = useState<boolean>(false);
    const [selectedQuote, setSelectedQuote] = useState<SellFiatTrade>();

    const [sellStep, setSellStep] = useState<SellStep>('BANK_ACCOUNT');
    const { navigateToSellForm } = useCoinmarketNavigation(account);
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    const { alternativeQuotes, isFromRedirect, quotes, quotesRequest, sellInfo, transactionId } =
        useSelector(state => state.wallet.coinmarket.sell);
    const device = useSelector(selectDevice);
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const dispatch = useDispatch();

    dispatch(loadInvityData());

    const [innerQuotes, setInnerQuotes] = useState<SellFiatTrade[] | undefined>(quotes);
    const [innerAlternativeQuotes, setInnerAlternativeQuotes] = useState<
        SellFiatTrade[] | undefined
    >(alternativeQuotes);

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
        trade => trade.tradeType === 'sell' && trade.key === transactionId,
    ) as TradeSell;

    useEffect(() => {
        if (!quotesRequest) {
            navigateToSellForm();

            return;
        }

        if (isFromRedirect) {
            if (transactionId && trade) {
                setSelectedQuote(trade.data);
                setSellStep('SEND_TRANSACTION');
            } else {
                getQuotes();
            }

            dispatch(setIsFromRedirect(false));
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
        dispatch,
        quotesRequest,
        isFromRedirect,
        timer,
        navigateToSellForm,
        transactionId,
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
            if (response.trade.error && response.trade.status !== 'LOGIN_REQUEST') {
                console.log(`[doSellTrade] ${response.trade.error}`);
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: response.trade.error,
                    }),
                );

                return undefined;
            }
            if (
                response.trade.status === 'LOGIN_REQUEST' ||
                response.trade.status === 'SITE_ACTION_REQUEST' ||
                (response.trade.status === 'SUBMITTED' && provider.flow === 'PAYMENT_GATE')
            ) {
                if (provider.flow === 'PAYMENT_GATE') {
                    await dispatch(saveTrade(response.trade, account, new Date().toISOString()));
                    await dispatch(saveTransactionId(response.trade.orderId));
                    setSelectedQuote(response.trade);
                    setSellStep('SEND_TRANSACTION');
                }
                dispatch(submitRequestForm(response.tradeForm?.form));

                return undefined;
            }

            return response.trade;
        }
        const errorMessage = 'No response from the server';
        console.log(`[doSellTrade] ${errorMessage}`);
        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: errorMessage,
            }),
        );
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
            const result = await dispatch(
                openCoinmarketSellConfirmModal(provider?.companyName, quote.cryptoCurrency),
            );
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
            const cryptoStringAmount = shouldSendInSats
                ? amountToSatoshi(selectedQuote.cryptoStringAmount, network.decimals)
                : selectedQuote.cryptoStringAmount;
            const destinationPaymentExtraId =
                selectedQuote.destinationPaymentExtraId || trade?.data?.destinationPaymentExtraId;
            const result = await recomposeAndSign(
                selectedAccount,
                destinationAddress,
                cryptoStringAmount,
                destinationPaymentExtraId,
            );
            if (result?.success) {
                // send txid to the server as confirmation
                const { txid } = result.payload;
                const quote: SellFiatTrade = {
                    ...selectedQuote,
                    txid,
                    destinationAddress,
                    destinationPaymentExtraId,
                };
                const response = await invityAPI.doSellConfirm(quote);
                if (!response) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: 'No response from the server',
                        }),
                    );
                } else if (response.error || !response.status || !response.orderId) {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: response.error || 'Invalid response from the server',
                        }),
                    );
                }

                await dispatch(saveTrade(response, account, new Date().toISOString()));
                await dispatch(saveTransactionId(selectedQuote.orderId));

                dispatch(
                    goto('wallet-coinmarket-sell-detail', {
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    }),
                );
            }
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Cannot send transaction, missing data',
                }),
            );
        }
    };

    return {
        sendTransaction,
        callInProgress,
        selectedQuote,
        trade,
        device,
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
