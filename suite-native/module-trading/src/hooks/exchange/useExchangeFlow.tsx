import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import type { ExchangeTrade, FormResponse } from 'invity-api';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingFulfillValue,
    TradingSendRejectedProps,
    TradingSignAndPushSendFormTransactionProps,
    cryptoIdToNetworkAndContractAddress,
    exchangeThunks,
    selectTradingExchangeFormStep,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    FeesRootState,
    WalletSettingsRootState,
    selectConvertedNetworkFeeInfo,
    selectIsAmountInSats,
    selectSendSerializedTx,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { TokensRootState, selectAccountTokenDecimals } from '@suite-native/tokens';
import { NativeSupportedFeeLevel } from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';

import { selectExchangeSelectedSendAccount } from '../../selectors/exchangeSelectors';
import { composeTradingTransactionThunk, signAndPushSendFormTransactionThunk } from '../../thunks';
import { buildTradingUrl, getSourceForForm } from '../../utils/general/formUtils';

type TradingExchangeConfirmTradeProps = {
    receiveAddress: string;
    extraField?: string;
    trade?: ExchangeTrade;
    approvalFlow?: boolean;
};

let pushApprovalResolver: ((approved: boolean) => void) | null = null;

const waitForPushApproval = (): Promise<boolean> =>
    new Promise(resolve => {
        pushApprovalResolver = resolve;
    });

export const useExchangeFlow = () => {
    const dispatch = useDispatch();

    const { showToast } = useToast();

    const [pushApprovalNeeded, setPushApprovalNeeded] = useState(false);

    const rootNavigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);

    const sendAccount = useSelector(selectExchangeSelectedSendAccount);

    const { contractAddress } = cryptoIdToNetworkAndContractAddress(selectedQuote?.send);

    const tokenDecimals = useSelector((state: TokensRootState) =>
        selectAccountTokenDecimals(state, sendAccount?.key, contractAddress as TokenAddress),
    );

    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, sendAccount?.symbol),
    );

    const formStep = useSelector(selectTradingExchangeFormStep);

    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, sendAccount?.symbol),
    );

    const serializedTx = useSelector(selectSendSerializedTx);

    invariant(sendAccount, 'Send account is required');
    invariant(selectedQuote?.send, 'Send cryptoId is required');

    const network = getNetwork(sendAccount.symbol);
    const decimals = tokenDecimals ?? network.decimals;
    // TODO: slip24 - not implemented in mobile
    const isSlip24Active = false;

    const resolvePushApproval = (approved: boolean) => {
        setPushApprovalNeeded(false);
        pushApprovalResolver?.(approved);
        pushApprovalResolver = null;
    };

    useEffect(
        () => () => {
            // remove any possible request when the component unmounts
            TrezorConnect.cancel();
            if (pushApprovalResolver) {
                pushApprovalResolver(false);
                pushApprovalResolver = null;
            }
            setPushApprovalNeeded(false);
        },
        [],
    );

    // whenever we get a form from the webview, we need to navigate to the webview screen
    const handleWebview = useCallback(
        (trade: ExchangeTrade, formData: FormResponse['form'], returnUrl: string) => {
            const source = getSourceForForm(formData);
            if (!source) {
                return;
            }

            rootNavigation.navigate(RootStackRoutes.TradingWebView, {
                closeCallbackUrl: returnUrl,
                source,
                orderId: trade?.orderId,
            });
        },
        [rootNavigation],
    );

    // this is called when we want to compose a transaction
    const composeRequest = async (selectedFeeLevel?: NativeSupportedFeeLevel) => {
        if (!network || !networkFeeInfo) {
            console.error('Network and networkFeeInfo are required for composing transaction');

            return;
        }

        try {
            const levels = await dispatch(
                composeTradingTransactionThunk({
                    tradeType: 'exchange',
                    account: sendAccount,
                    network,
                    feeInfo: networkFeeInfo,
                    selectedFeeLevel,
                }),
            ).unwrap();

            return levels;
        } catch (error) {
            console.error('Failed to compose trading transaction:', error);
        }
    };

    // this is called when we want to fetch fees and compose a transaction
    const fetchFeesAndCompose = async () => {
        if (!sendAccount) {
            console.error('Send account is required');

            return;
        }

        await dispatch(updateFeeInfoThunk({ networkSymbol: sendAccount.symbol }));
        await composeRequest('normal');
    };

    const getCommonFunctions = useCallback(
        (trade?: ExchangeTrade) => {
            const tradeToUse = trade ?? selectedQuote;

            const returnUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType: 'exchange',
                orderId: tradeToUse.orderId,
                exchange: tradeToUse.exchange,
            });

            const triggerAnalyticsTradeConfirmation = () => {
                // TODO: add analytics
            };

            const processResponseData = (response: ExchangeTrade) =>
                handleWebview(tradeToUse, response.tradeForm?.form, returnUrl);

            const nextStep = () => {
                // TODO: add next step
            };

            return {
                returnUrl,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            };
        },
        [handleWebview, selectedQuote],
    );

    // changing trade state and initial confirmation
    const confirmTrade = async ({
        receiveAddress,
        extraField,
        trade,
        approvalFlow,
    }: TradingExchangeConfirmTradeProps & { sendAccount: any }): Promise<boolean> => {
        const commonFunctions = getCommonFunctions(trade);
        if (!commonFunctions) {
            return false;
        }

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        if (!trade || !sendAccount) {
            return false;
        }

        return await dispatch(
            exchangeThunks.confirmTradeThunk({
                returnUrl,
                receiveAddress,
                account: sendAccount,
                extraField,
                trade,
                approvalFlow,
                triggerAnalyticsTradeConfirmation,
                processResponseData,
                nextStep,
            }),
        ).unwrap();
    };

    // this is called when we want to sign and send a transaction
    // waitForPushApproval is used so that we can wait for the user to approve the transaction before sending it
    const signAndSendTransaction = async () => {
        const commonFunctions = getCommonFunctions(selectedQuote);

        if (!commonFunctions || !sendAccount) {
            return false;
        }

        const { returnUrl, triggerAnalyticsTradeConfirmation, processResponseData, nextStep } =
            commonFunctions;

        const signAndPushSendFormTransaction = async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps): Promise<TradingFulfillValue> => {
            setPushApprovalNeeded(true);

            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                    waitForPushApprovalPromise: waitForPushApproval,
                }),
            );

            if (isFulfilled(result)) {
                return result.payload as TradingFulfillValue;
            }

            return result.error as TradingFulfillValue;
        };

        try {
            await dispatch(
                exchangeThunks.sendTransactionThunk({
                    account: sendAccount,
                    trade: selectedQuote,
                    returnUrl,
                    setMaxOutputId: undefined,
                    decimals,
                    shouldSendInSats,
                    isSlip24Active,
                    nextStep,
                    processResponseData,
                    triggerAnalyticsTradeConfirmation,
                    signAndPushSendFormTransaction,
                }),
            ).unwrap();

            return true;
        } catch (e) {
            const errorTyped = e as TradingSendRejectedProps;

            showToast({
                icon: 'warningCircle',
                variant: 'error',
                message:
                    errorTyped.type === 'sign-transaction-timeout' ? (
                        <Translation id="moduleSend.review.outputs.errorAlert.solana.description" />
                    ) : (
                        e.message
                    ),
            });

            return false;
        }
    };

    return {
        confirmTrade,
        composeRequest,
        formStep,
        fetchFeesAndCompose,
        signAndSendTransaction,
        serializedTx,
        resolvePushApproval,
        pushApprovalNeeded,
    };
};
