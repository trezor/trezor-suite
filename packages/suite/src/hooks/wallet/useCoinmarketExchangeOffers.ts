import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector, useDevice } from '@suite-hooks';
import { useTimer } from '@suite-hooks/useTimeInterval';
import { ExchangeCoinInfo, ExchangeTrade } from 'invity-api';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import * as routerActions from '@suite-actions/routerActions';
import { Account } from '@wallet-types';
import { Props, ContextValues, ExchangeStep } from '@wallet-types/coinmarketExchangeOffers';
import * as notificationActions from '@suite-actions/notificationActions';
import { splitToFixedFloatQuotes } from '@wallet-utils/coinmarket/exchangeUtils';
import networks from '@wallet-config/networks';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { useCoinmarketRecomposeAndSign } from './useCoinmarketRecomposeAndSign ';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from '@wallet-constants/coinmarket/metadata';

const getReceiveAccountSymbol = (
    symbol?: string,
    exchangeCoinInfo?: ExchangeCoinInfo[],
): string | undefined => {
    if (symbol) {
        // check if the symbol is ETH token, in that case use ETH network as receiving account
        const coinInfo = exchangeCoinInfo?.find(ci => ci.ticker === symbol);
        if (coinInfo?.token === 'ETH') {
            return 'eth';
        }
        return symbol.toLowerCase();
    }

    return symbol;
};

export const useOffers = (props: Props) => {
    const timer = useTimer();
    const {
        selectedAccount,
        quotesRequest,
        fixedQuotes,
        floatQuotes,
        exchangeInfo,
        device,
        addressVerified,
    } = props;

    const { isLocked } = useDevice();
    const { account } = selectedAccount;
    const [callInProgress, setCallInProgress] = useState<boolean>(isLocked() || false);
    const [selectedQuote, setSelectedQuote] = useState<ExchangeTrade>();
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();
    const [suiteReceiveAccounts, setSuiteReceiveAccounts] =
        useState<ContextValues['suiteReceiveAccounts']>();
    const [innerFixedQuotes, setInnerFixedQuotes] = useState<ExchangeTrade[] | undefined>(
        fixedQuotes,
    );
    const [innerFloatQuotes, setInnerFloatQuotes] = useState<ExchangeTrade[] | undefined>(
        floatQuotes,
    );
    const [exchangeStep, setExchangeStep] = useState<ExchangeStep>('RECEIVING_ADDRESS');
    const { navigateToExchangeForm } = useCoinmarketNavigation(account);
    const {
        goto,
        saveTrade,
        openCoinmarketExchangeConfirmModal,
        saveTransactionId,
        addNotification,
        verifyAddress,
    } = useActions({
        goto: routerActions.goto,
        saveTrade: coinmarketExchangeActions.saveTrade,
        openCoinmarketExchangeConfirmModal:
            coinmarketExchangeActions.openCoinmarketExchangeConfirmModal,
        saveTransactionId: coinmarketExchangeActions.saveTransactionId,
        addNotification: notificationActions.addToast,
        verifyAddress: coinmarketCommonActions.verifyAddress,
    });

    const { invityAPIUrl, exchangeCoinInfo, accounts } = useSelector(state => ({
        invityAPIUrl: state.suite.settings.debug.invityAPIUrl,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
        accounts: state.wallet.accounts,
    }));

    const { recomposeAndSign } = useCoinmarketRecomposeAndSign();

    if (invityAPIUrl) {
        invityAPI.setInvityAPIServer(invityAPIUrl);
    }

    const getQuotes = useCallback(async () => {
        if (!selectedQuote && quotesRequest) {
            timer.loading();
            invityAPI.createInvityAPIKey(account.descriptor);
            const allQuotes = await invityAPI.getExchangeQuotes(quotesRequest);
            if (Array.isArray(allQuotes)) {
                if (allQuotes.length === 0) {
                    timer.stop();
                    return;
                }
                const [fixedQuotes, floatQuotes] = splitToFixedFloatQuotes(allQuotes, exchangeInfo);
                setInnerFixedQuotes(fixedQuotes);
                setInnerFloatQuotes(floatQuotes);
            } else {
                setInnerFixedQuotes(undefined);
                setInnerFloatQuotes(undefined);
            }
            timer.reset();
        }
    }, [account.descriptor, exchangeInfo, quotesRequest, selectedQuote, timer]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToExchangeForm();
            return;
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

    const selectQuote = async (quote: ExchangeTrade) => {
        const provider =
            exchangeInfo?.providerInfos && quote.exchange
                ? exchangeInfo?.providerInfos[quote.exchange]
                : null;
        if (quotesRequest) {
            const result = await openCoinmarketExchangeConfirmModal(provider?.companyName);
            if (result) {
                setSelectedQuote(quote);
                timer.stop();
            }
        }
    };

    const receiveSymbol = getReceiveAccountSymbol(selectedQuote?.receive, exchangeCoinInfo);

    useEffect(() => {
        if (selectedQuote && exchangeStep === 'RECEIVING_ADDRESS') {
            const unavailableCapabilities = device?.unavailableCapabilities ?? {};
            // is the symbol supported by the suite and the device natively
            const receiveNetworks = networks.filter(
                n => n.symbol === receiveSymbol && !unavailableCapabilities[n.symbol],
            );
            if (receiveNetworks.length > 0) {
                // get accounts of the current symbol belonging to the current device
                setSuiteReceiveAccounts(
                    accounts.filter(
                        a =>
                            a.deviceState === device?.state &&
                            a.symbol === receiveSymbol &&
                            (!a.empty ||
                                a.visible ||
                                (a.accountType === 'normal' && a.index === 0)),
                    ),
                );
                return;
            }
        }
        setSuiteReceiveAccounts(undefined);
    }, [accounts, device, exchangeStep, receiveSymbol, selectedQuote]);

    const confirmTrade = async (address: string, extraField?: string) => {
        const { address: refundAddress } = getUnusedAddressFromAccount(account);
        if (!selectedQuote || !refundAddress) return;
        setCallInProgress(true);
        const response = await invityAPI.doExchangeTrade({
            trade: selectedQuote,
            receiveAddress: address,
            refundAddress,
            extraField,
        });
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
        } else {
            setExchangeStep('SEND_TRANSACTION');
            setSelectedQuote(response);
        }
        setCallInProgress(false);
    };

    const sendTransaction = async () => {
        if (
            selectedQuote &&
            selectedQuote.orderId &&
            selectedQuote.sendAddress &&
            selectedQuote.sendStringAmount
        ) {
            const result = await recomposeAndSign(
                selectedAccount,
                selectedQuote.sendAddress,
                selectedQuote.sendStringAmount,
                selectedQuote.partnerPaymentExtraId,
            );
            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                await saveTrade(selectedQuote, account, new Date().toISOString());
                await saveTransactionId(selectedQuote.orderId);
                goto('wallet-coinmarket-exchange-detail', {
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
        callInProgress,
        confirmTrade,
        sendTransaction,
        selectedQuote,
        suiteReceiveAccounts,
        verifyAddress,
        device,
        timer,
        exchangeInfo,
        exchangeStep,
        setExchangeStep,
        saveTrade,
        quotesRequest,
        addressVerified,
        fixedQuotes: innerFixedQuotes,
        floatQuotes: innerFloatQuotes,
        selectQuote,
        account,
        receiveSymbol,
        receiveAccount,
        setReceiveAccount,
        getQuotes,
    };
};

export const CoinmarketExchangeOffersContext = createContext<ContextValues | null>(null);
CoinmarketExchangeOffersContext.displayName = 'CoinmarketExchangeOffersContext';

export const useCoinmarketExchangeOffersContext = () => {
    const context = useContext(CoinmarketExchangeOffersContext);
    if (context === null) throw Error('CoinmarketExchangeOffersContext used without Context');
    return context;
};
