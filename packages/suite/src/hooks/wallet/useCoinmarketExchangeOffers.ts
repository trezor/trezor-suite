import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import invityAPI from '@suite-services/invityAPI';
import { useActions, useSelector, useDevice } from '@suite-hooks';
import { useTimer } from '@suite-hooks/useTimeInterval';
import { ExchangeCoinInfo, ExchangeTrade } from 'invity-api';
import * as coinmarketExchangeActions from '@wallet-actions/coinmarketExchangeActions';
import { Account } from '@wallet-types';
import { Props, ContextValues, ExchangeStep } from '@wallet-types/coinmarketExchangeOffers';
import * as notificationActions from '@suite-actions/notificationActions';
import { splitToQuoteCategories } from '@wallet-utils/coinmarket/exchangeUtils';
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
        dexQuotes,
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
    const [innerDexQuotes, setInnerDexQuotes] = useState<ExchangeTrade[] | undefined>(dexQuotes);
    const [exchangeStep, setExchangeStep] = useState<ExchangeStep>('RECEIVING_ADDRESS');
    const { navigateToExchangeForm, navigateToExchangeDetail } = useCoinmarketNavigation(account);
    const {
        saveTrade,
        openCoinmarketExchangeConfirmModal,
        saveTransactionId,
        addNotification,
        verifyAddress,
    } = useActions({
        saveTrade: coinmarketExchangeActions.saveTrade,
        openCoinmarketExchangeConfirmModal:
            coinmarketExchangeActions.openCoinmarketExchangeConfirmModal,
        saveTransactionId: coinmarketExchangeActions.saveTransactionId,
        addNotification: notificationActions.addToast,
        verifyAddress: coinmarketExchangeActions.verifyAddress,
    });

    const { invityServerEnvironment, exchangeCoinInfo, accounts } = useSelector(state => ({
        invityServerEnvironment: state.suite.settings.debug.invityServerEnvironment,
        exchangeCoinInfo: state.wallet.coinmarket.exchange.exchangeCoinInfo,
        accounts: state.wallet.accounts,
    }));

    const { recomposeAndSign } = useCoinmarketRecomposeAndSign();

    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
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
                const [fixedQuotes, floatQuotes, dexQuotes] = splitToQuoteCategories(
                    allQuotes,
                    exchangeInfo,
                );
                setInnerFixedQuotes(fixedQuotes);
                setInnerFloatQuotes(floatQuotes);
                setInnerDexQuotes(dexQuotes);
            } else {
                setInnerFixedQuotes(undefined);
                setInnerFloatQuotes(undefined);
                setInnerDexQuotes(undefined);
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
            const result = await openCoinmarketExchangeConfirmModal(
                provider?.companyName,
                quote.isDex,
            );
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

    const confirmTrade = async (address: string, extraField?: string, trade?: ExchangeTrade) => {
        let ok = false;
        const { address: refundAddress } = getUnusedAddressFromAccount(account);
        if (!trade) {
            trade = selectedQuote;
        }
        if (!trade || !refundAddress) return false;

        if (trade.isDex && !trade.fromAddress) {
            trade = { ...trade, fromAddress: refundAddress };
        }

        setCallInProgress(true);
        const response = await invityAPI.doExchangeTrade({
            trade,
            receiveAddress: address,
            refundAddress,
            extraField,
        });
        if (!response) {
            addNotification({
                type: 'error',
                error: 'No response from the server',
            });
        } else if (
            response.error ||
            !response.status ||
            !response.orderId ||
            response.status === 'ERROR'
        ) {
            addNotification({
                type: 'error',
                error: response.error || 'Error response from the server',
            });
            setSelectedQuote(response);
        } else if (response.status === 'APPROVAL_REQ' || response.status === 'APPROVAL_PENDING') {
            setSelectedQuote(response);
            setExchangeStep('SEND_APPROVAL_TRANSACTION');
            ok = true;
        } else if (response.status === 'CONFIRM') {
            setSelectedQuote(response);
            if (response.isDex) {
                if (exchangeStep === 'RECEIVING_ADDRESS' || trade.approvalType === 'ZERO') {
                    setExchangeStep('SEND_APPROVAL_TRANSACTION');
                } else {
                    setExchangeStep('SEND_TRANSACTION');
                }
            } else {
                setExchangeStep('SEND_TRANSACTION');
            }
            ok = true;
        } else {
            // CONFIRMING, SUCCESS
            await saveTrade(response, account, new Date().toISOString());
            await saveTransactionId(response.orderId);
            ok = true;
            navigateToExchangeDetail();
        }
        setCallInProgress(false);
        return ok;
    };

    const sendDexTransaction = async () => {
        if (
            selectedQuote &&
            selectedQuote.dexTx &&
            (selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.status === 'CONFIRM')
        ) {
            // after discussion with 1inch, adjust the gas limit by the factor of 1.25
            // swap can use different swap paths when mining tx than when estimating tx
            // the geth gas estimate may be too low
            const result = await recomposeAndSign(
                selectedAccount,
                selectedQuote.dexTx.to,
                selectedQuote.dexTx.value,
                selectedQuote.partnerPaymentExtraId,
                selectedQuote.dexTx.data,
                true,
                selectedQuote.status === 'CONFIRM' ? '1.25' : undefined,
            );

            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                const { txid } = result.payload;
                const quote = { ...selectedQuote };
                if (selectedQuote.status === 'CONFIRM' && selectedQuote.approvalType !== 'ZERO') {
                    quote.receiveTxHash = txid;
                    quote.status = 'CONFIRMING';
                    await saveTrade(quote, account, new Date().toISOString());
                    confirmTrade(quote.receiveAddress || '', undefined, quote);
                } else {
                    quote.approvalSendTxHash = txid;
                    quote.status = 'APPROVAL_PENDING';
                    confirmTrade(quote.receiveAddress || '', undefined, quote);
                }
            }
        } else {
            addNotification({
                type: 'error',
                error: 'Cannot send transaction, missing data',
            });
        }
    };

    const sendTransaction = async () => {
        if (selectedQuote?.isDex) {
            sendDexTransaction();
            return;
        }
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
                navigateToExchangeDetail();
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
        setSelectedQuote,
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
        dexQuotes: innerDexQuotes,
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
