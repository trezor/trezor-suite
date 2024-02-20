import { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { ExchangeTrade } from 'invity-api';

import { useTimer } from '@trezor/react-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { networksCompatibility as networks } from '@suite-common/wallet-config';
import { amountToSatoshi } from '@suite-common/wallet-utils';
import { selectDevice } from '@suite-common/wallet-core';

import invityAPI from 'src/services/suite/invityAPI';
import { useActions, useSelector, useDevice } from 'src/hooks/suite';
import * as coinmarketExchangeActions from 'src/actions/wallet/coinmarketExchangeActions';
import { Account } from 'src/types/wallet';
import {
    UseCoinmarketExchangeFormProps,
    ContextValues,
    ExchangeStep,
} from 'src/types/wallet/coinmarketExchangeOffers';
import { splitToQuoteCategories } from 'src/utils/wallet/coinmarket/exchangeUtils';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

import { useCoinmarketRecomposeAndSign } from './useCoinmarketRecomposeAndSign';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const useOffers = ({ selectedAccount }: UseCoinmarketExchangeFormProps) => {
    const timer = useTimer();
    const { isLocked } = useDevice();
    const { account, network } = selectedAccount;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const [callInProgress, setCallInProgress] = useState<boolean>(isLocked() || false);
    const [selectedQuote, setSelectedQuote] = useState<ExchangeTrade>();
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();
    const [suiteReceiveAccounts, setSuiteReceiveAccounts] =
        useState<ContextValues['suiteReceiveAccounts']>();

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
        addNotification: notificationsActions.addToast,
        verifyAddress: coinmarketExchangeActions.verifyAddress,
    });

    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );
    const accounts = useSelector(state => state.wallet.accounts);
    const device = useSelector(selectDevice);
    const { addressVerified, dexQuotes, exchangeInfo, fixedQuotes, floatQuotes, quotesRequest } =
        useSelector(state => state.wallet.coinmarket.exchange);
    const isDebug = useSelector(selectIsDebugModeActive);

    const [innerFixedQuotes, setInnerFixedQuotes] = useState<ExchangeTrade[] | undefined>(
        fixedQuotes,
    );
    const [innerFloatQuotes, setInnerFloatQuotes] = useState<ExchangeTrade[] | undefined>(
        floatQuotes,
    );
    const [innerDexQuotes, setInnerDexQuotes] = useState<ExchangeTrade[] | undefined>(dexQuotes);
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
                quote.send,
                quote.receive,
            );
            if (result) {
                setSelectedQuote(quote);
                timer.stop();
            }
        }
    };

    const receiveNetwork = selectedQuote?.receive && cryptoToNetworkSymbol(selectedQuote?.receive);

    useEffect(() => {
        if (selectedQuote && exchangeStep === 'RECEIVING_ADDRESS') {
            const unavailableCapabilities = device?.unavailableCapabilities ?? {};
            // is the symbol supported by the suite and the device natively
            const receiveNetworks = networks.filter(
                n =>
                    n.symbol === receiveNetwork &&
                    !unavailableCapabilities[n.symbol] &&
                    ((n.isDebugOnly && isDebug) || !n.isDebugOnly),
            );
            if (receiveNetworks.length > 0) {
                // get accounts of the current symbol belonging to the current device
                setSuiteReceiveAccounts(
                    accounts.filter(
                        a =>
                            a.deviceState === device?.state &&
                            a.symbol === receiveNetwork &&
                            (!a.empty ||
                                a.visible ||
                                (a.accountType === 'normal' && a.index === 0)),
                    ),
                );

                return;
            }
        }
        setSuiteReceiveAccounts(undefined);
    }, [accounts, device, exchangeStep, receiveNetwork, selectedQuote, isDebug]);

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
            const sendStringAmount = shouldSendInSats
                ? amountToSatoshi(selectedQuote.sendStringAmount, network.decimals)
                : selectedQuote.sendStringAmount;
            const result = await recomposeAndSign(
                selectedAccount,
                selectedQuote.sendAddress,
                sendStringAmount,
                selectedQuote.partnerPaymentExtraId,
                undefined,
                undefined,
                undefined,
                ['broadcast', 'bitcoinRBF'],
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
        quotesRequest,
        addressVerified,
        fixedQuotes: innerFixedQuotes,
        floatQuotes: innerFloatQuotes,
        dexQuotes: innerDexQuotes,
        selectQuote,
        account,
        receiveSymbol: receiveNetwork,
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
