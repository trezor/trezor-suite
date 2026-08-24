import { type ReactNode, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';
import type { ExchangeTrade, SellFiatTrade } from 'invity-api';

import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type TradingFulfillValue,
    type TradingRootStateWithDeviceAndAccounts,
    type TradingSendRejectedProps,
    type TradingSignAndPushSendFormTransactionProps,
    cryptoIdToNetworkAndContractAddress,
    exchangeThunks,
    selectTradingAccountKeyByTradeType,
    selectTradingExchangeSelectedQuote,
    selectTradingSellSelectedQuote,
    sellThunks,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FormDraftRootState,
    type SerializedTx,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectDeepCopyOfFormDraft,
    selectIsAmountInSats,
    selectSendSerializedTx,
} from '@suite-common/wallet-core';
import { type FeeLevelLabel, type TokenAddress } from '@suite-common/wallet-types';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type TxKeyPath } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenDecimals } from '@suite-native/tokens';
import {
    type TradingRootState,
    getFormDraftKeyByTradeType,
    selectIsTradingSlip24Enabled,
} from '@suite-native/trading-state';
import {
    selectFeeLevels,
    usePrecomposedTransactionError,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';
import { noop } from '@trezor/utils';

import { useComposeTradingTransaction } from './useComposeTradingTransaction';
import { useConsent } from './useConsent';
import { signAndPushSendFormTransactionThunk } from '../../thunks';

export type TradingTransactionSignAndSendProps = {
    nextStep: () => void;
    onError: (error: TradingSendRejectedProps<TxKeyPath>) => void;
};

export type UseTradingTransactionProps = {
    tradeType: 'exchange' | 'sell';
    returnUrl?: string;
    processResponseData?: (response: any) => void;
    triggerAnalyticsTradeConfirmation?: () => void;
};

export type UseTradingTransactionReturnProps = {
    txnErrorString: ReactNode;
    composeTradingTransaction: () => Promise<unknown>;
    signAndSendTransaction: (props: TradingTransactionSignAndSendProps) => Promise<boolean>;
    signAndPushSendFormTransaction: (
        props: TradingSignAndPushSendFormTransactionProps,
    ) => Promise<TradingFulfillValue>;
    serializedTx: SerializedTx | undefined;
    resolveTransactionSendConsent: (approved: boolean) => void;
    isTransactionSendConsentRequested: boolean;
    waitForTransactionSendConsent: () => Promise<boolean>;
    tokenDecimals: number | null;
    shouldSendInSats: boolean;
    isSlip24Active: boolean;
};

export const useTradingTransaction = ({
    tradeType,
    returnUrl,
    processResponseData,
    triggerAnalyticsTradeConfirmation,
}: UseTradingTransactionProps): UseTradingTransactionReturnProps => {
    const dispatch = useDispatch();

    const sendAccountKey = useSelector((state: TradingRootState) =>
        selectTradingAccountKeyByTradeType(state, tradeType),
    );

    const sendAccount = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, sendAccountKey),
    );

    const selectedQuote = useSelector((state: TradingRootState) =>
        tradeType === 'exchange'
            ? selectTradingExchangeSelectedQuote(state)
            : selectTradingSellSelectedQuote(state),
    );

    const draft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, getFormDraftKeyByTradeType(tradeType)),
    );

    const { selectedFee } = draft ?? {};

    const { contractAddress } = cryptoIdToNetworkAndContractAddress(
        tradeType === 'exchange'
            ? (selectedQuote as ExchangeTrade)?.send
            : (selectedQuote as SellFiatTrade)?.cryptoCurrency,
    );

    const tokenDecimals = useSelector((state: TokensRootState) =>
        selectAccountTokenDecimals(state, sendAccount?.key, contractAddress as TokenAddress),
    );

    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, sendAccount?.symbol),
    );

    const serializedTx = useSelector(selectSendSerializedTx);

    const feeLevels = useSelector(selectFeeLevels);

    const selectedLevel = feeLevels[(selectedFee as FeeLevelLabel) ?? 'normal'];
    const feeError = selectedLevel?.type === 'error' ? selectedLevel.error : null;

    const txnErrorString = usePrecomposedTransactionError({
        error: feeError,
        networkSymbol: sendAccount?.symbol,
    });

    const {
        isConsentRequested: isTransactionSendConsentRequested,
        waitForConsent: waitForTransactionSendConsent,
        resolveConsent: resolveTransactionSendConsent,
    } = useConsent();

    const isSlip24Active = useSelector(
        (
            state: MessageSystemRootState &
                FeatureFlagsRootState &
                TradingRootStateWithDeviceAndAccounts,
        ) => selectIsTradingSlip24Enabled(state, sendAccount ?? undefined),
    );

    const { composeTradingTransaction } = useComposeTradingTransaction({ tradeType });

    // cancel txn signing on unmount
    useEffect(() => () => TrezorConnect.cancel(), []);

    // this is the reusable signAndPushSendFormTransaction function
    // waitForPushApproval is used so that we can wait for the user to approve the transaction before sending it
    const signAndPushSendFormTransaction = useCallback(
        async ({
            formState,
            precomposedTransaction,
            selectedAccount,
            paymentRequests,
        }: TradingSignAndPushSendFormTransactionProps): Promise<TradingFulfillValue> => {
            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction,
                    selectedAccount,
                    paymentRequests,
                    waitForPushApprovalPromise: waitForTransactionSendConsent,
                }),
            );

            if (isFulfilled(result)) {
                return result.payload;
            }

            return result.error as TradingFulfillValue;
        },
        [dispatch, waitForTransactionSendConsent],
    );

    // this is called when we want to sign and send a transaction
    const signAndSendTransaction = useCallback(
        async ({ nextStep, onError }: TradingTransactionSignAndSendProps) => {
            if (!selectedQuote || !sendAccount) {
                console.error(
                    'Selected quote and send account are required to sign and send transaction',
                );

                return false;
            }

            const network = getNetwork(sendAccount.symbol);
            const decimals = tokenDecimals ?? network.decimals;

            try {
                if (tradeType === 'exchange') {
                    await dispatch(
                        exchangeThunks.sendTransactionThunk({
                            account: sendAccount,
                            trade: selectedQuote as ExchangeTrade,
                            returnUrl: returnUrl || '',
                            setMaxOutputId: draft?.setMaxOutputId,
                            decimals,
                            shouldSendInSats,
                            isSlip24Active,
                            nextStep,
                            processResponseData: processResponseData || noop,
                            triggerAnalyticsTradeConfirmation:
                                triggerAnalyticsTradeConfirmation || noop,
                            signAndPushSendFormTransaction,
                        }),
                    ).unwrap();

                    return true;
                }

                await dispatch(
                    sellThunks.sendTransactionThunk({
                        account: sendAccount,
                        trade: selectedQuote as SellFiatTrade,
                        decimals,
                        shouldSendInSats,
                        isSlip24Active,
                        nextStep,
                        signAndPushSendFormTransaction,
                    }),
                ).unwrap();

                return true;
            } catch (e) {
                onError(e as TradingSendRejectedProps<TxKeyPath>);

                return false;
            }
        },
        [
            selectedQuote,
            sendAccount,
            tokenDecimals,
            tradeType,
            dispatch,
            draft,
            shouldSendInSats,
            isSlip24Active,
            signAndPushSendFormTransaction,
            returnUrl,
            processResponseData,
            triggerAnalyticsTradeConfirmation,
        ],
    );

    return {
        txnErrorString,
        composeTradingTransaction,
        signAndSendTransaction,
        signAndPushSendFormTransaction,
        serializedTx,
        resolveTransactionSendConsent,
        isTransactionSendConsentRequested,
        waitForTransactionSendConsent,
        tokenDecimals,
        shouldSendInSats,
        isSlip24Active,
    };
};
