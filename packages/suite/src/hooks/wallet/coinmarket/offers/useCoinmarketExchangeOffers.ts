import { useState, useEffect, useCallback } from 'react';
import { ExchangeTrade } from 'invity-api';
import { notificationsActions } from '@suite-common/toast-notifications';
import { networksCompatibility as networks } from '@suite-common/wallet-config';
import { amountToSatoshi } from '@suite-common/wallet-utils';

import invityAPI from 'src/services/suite/invityAPI';
import { useActions, useDispatch, useSelector } from 'src/hooks/suite';
import * as coinmarketExchangeActions from 'src/actions/wallet/coinmarketExchangeActions';
import { Account } from 'src/types/wallet';
import {
    addIdsToQuotes,
    getUnusedAddressFromAccount,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketTradeExchangeType, UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import {
    selectHasExperimentalFeature,
    selectIsDebugModeActive,
} from 'src/reducers/suite/suiteReducer';
import { ExperimentalFeature } from 'src/constants/suite/experimental';
import { getSuccessQuotesOrdered } from 'src/utils/wallet/coinmarket/exchangeUtils';
import {
    CoinmarketExchangeOffersContextProps,
    CoinmarketExchangeStepType,
    CoinmarketOffersContextValues,
} from 'src/types/coinmarket/coinmarketOffers';
import { SET_MODAL_CRYPTO_CURRENCY } from 'src/actions/wallet/constants/coinmarketCommonConstants';
import { useCoinmarketCommonOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { useCoinmarketRecomposeAndSign } from 'src/hooks/wallet/useCoinmarketRecomposeAndSign';

export const useCoinmarketExchangeOffers = ({
    selectedAccount,
}: UseCoinmarketProps): CoinmarketExchangeOffersContextProps => {
    const type = 'exchange';
    const dispatch = useDispatch();
    const {
        callInProgress,
        account,
        selectedQuote,
        timer,
        device,
        setCallInProgress,
        setSelectedQuote,
        checkQuotesTimer,
    } = useCoinmarketCommonOffers<CoinmarketTradeExchangeType>({ selectedAccount, type });
    const { network } = selectedAccount;
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const [receiveAccount, setReceiveAccount] = useState<Account | undefined>();
    const [suiteReceiveAccounts, setSuiteReceiveAccounts] =
        useState<
            CoinmarketOffersContextValues<CoinmarketTradeExchangeType>['suiteReceiveAccounts']
        >();

    const [exchangeStep, setExchangeStep] =
        useState<CoinmarketExchangeStepType>('RECEIVING_ADDRESS');
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

    const accounts = useSelector(state => state.wallet.accounts);
    const { addressVerified, exchangeInfo, quotes, quotesRequest } = useSelector(
        state => state.wallet.coinmarket.exchange,
    );
    const isDebug = useSelector(selectIsDebugModeActive);

    const [innerQuotes, setInnerQuotes] = useState<ExchangeTrade[] | undefined>(
        quotes ? getSuccessQuotesOrdered(quotes, exchangeInfo) : undefined,
    );

    const { recomposeAndSign } = useCoinmarketRecomposeAndSign();

    const bnbExperimentalFeature = useSelector(
        selectHasExperimentalFeature(ExperimentalFeature.BnbSmartChain),
    );

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
                const successQuotes = addIdsToQuotes<CoinmarketTradeExchangeType>(
                    getSuccessQuotesOrdered(allQuotes, exchangeInfo),
                    'exchange',
                );
                setInnerQuotes(successQuotes);
            } else {
                setInnerQuotes(undefined);
            }
            timer.reset();
        }
    }, [account.descriptor, exchangeInfo, quotesRequest, selectedQuote, timer]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToExchangeForm();

            return;
        }

        checkQuotesTimer(getQuotes);
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
                dispatch({
                    type: SET_MODAL_CRYPTO_CURRENCY,
                    modalCryptoSymbol: quote.receive,
                });
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
                    ((n.isDebugOnly && isDebug) || !n.isDebugOnly) &&
                    (bnbExperimentalFeature || n.symbol !== 'bnb'),
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
    }, [
        accounts,
        device,
        exchangeStep,
        receiveNetwork,
        selectedQuote,
        isDebug,
        bnbExperimentalFeature,
    ]);

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
            saveTrade(response, account, new Date().toISOString());
            saveTransactionId(response.orderId);
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
                selectedAccount.account,
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
                    saveTrade(quote, account, new Date().toISOString());
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
                selectedAccount.account,
                selectedQuote.sendAddress,
                sendStringAmount,
                selectedQuote.partnerPaymentExtraId,
                undefined,
                undefined,
                undefined,
                ['broadcast'],
            );
            // in case of not success, recomposeAndSign shows notification
            if (result?.success) {
                saveTrade(selectedQuote, account, new Date().toISOString());
                saveTransactionId(selectedQuote.orderId);
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
        type,
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
        quotes: innerQuotes,
        selectQuote,
        account,
        receiveSymbol: receiveNetwork,
        receiveAccount,
        setReceiveAccount,
        getQuotes,
    };
};
