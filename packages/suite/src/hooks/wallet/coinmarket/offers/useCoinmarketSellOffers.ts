import { useState, useEffect, useCallback } from 'react';

import type { BankAccount, SellFiatTrade } from 'invity-api';

import { notificationsActions } from '@suite-common/toast-notifications';
import { amountToSatoshi } from '@suite-common/wallet-utils';

import invityAPI from 'src/services/suite/invityAPI';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { createQuoteLink } from 'src/utils/wallet/coinmarket/sellUtils';
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
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import {
    getUnusedAddressFromAccount,
    processSellAndBuyQuotes,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import type { TradeSell } from 'src/types/wallet/coinmarketCommonTypes';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

import { useCoinmarketRecomposeAndSign } from './../../useCoinmarketRecomposeAndSign';
import { getFilteredSuccessQuotes, useCoinmarketCommonOffers } from './useCoinmarketCommonOffers';
import {
    CoinmarketTradeSellType,
    CoinmarketTradeType,
    UseCoinmarketProps,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketSellStepType } from 'src/types/coinmarket/coinmarketOffers';
import { useCoinmarketFilterReducer } from 'src/reducers/wallet/useCoinmarketFilterReducer';

export const useCoinmarketSellOffers = ({ selectedAccount }: UseCoinmarketProps) => {
    const {
        callInProgress,
        account,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    } = useCoinmarketCommonOffers<CoinmarketTradeSellType>({ selectedAccount });
    const { network } = selectedAccount;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const [sellStep, setSellStep] = useState<CoinmarketSellStepType>('BANK_ACCOUNT');
    const { navigateToSellForm } = useCoinmarketNavigation(account);

    const { isFromRedirect, quotes, quotesRequest, sellInfo, transactionId } = useSelector(
        state => state.wallet.coinmarket.sell,
    );
    const trades = useSelector(state => state.wallet.coinmarket.trades);
    const dispatch = useDispatch();

    dispatch(loadInvityData());

    const innerQuotesFilterReducer = useCoinmarketFilterReducer<CoinmarketTradeSellType>(quotes);
    const [innerQuotes, setInnerQuotes] = useState<SellFiatTrade[] | undefined>(
        getFilteredSuccessQuotes<CoinmarketTradeSellType>(quotes),
    );

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
                const quotes = processSellAndBuyQuotes<CoinmarketTradeSellType>(allQuotes);
                const successQuotes = getFilteredSuccessQuotes<CoinmarketTradeSellType>(quotes);
                setInnerQuotes(getFilteredSuccessQuotes<CoinmarketTradeSellType>(quotes));
                innerQuotesFilterReducer.dispatch({
                    type: 'FILTER_SET_PAYMENT_METHODS',
                    payload: successQuotes ?? [],
                });
            } else {
                setInnerQuotes(undefined);
            }
            timer.reset();
        }
    }, [account.descriptor, innerQuotesFilterReducer, quotesRequest, selectedQuote, timer]);

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

        checkQuotesTimer(getQuotes);
    }, [
        quotesRequest,
        isFromRedirect,
        timer,
        transactionId,
        trades,
        trade,
        dispatch,
        getQuotes,
        navigateToSellForm,
        checkQuotesTimer,
        setSelectedQuote,
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
        // destinationAddress may be set by useCoinmarketWatchTrade hook to the trade object
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
        quotes: innerQuotesFilterReducer.actions.handleFilterQuotes(innerQuotes),
        innerQuotesFilterReducer,
        sellStep,
        setSellStep,
        selectQuote,
        account,
        timer,
        sellInfo,
        needToRegisterOrVerifyBankAccount,
        getQuotes,
        type: 'sell' as CoinmarketTradeType,
    };
};
