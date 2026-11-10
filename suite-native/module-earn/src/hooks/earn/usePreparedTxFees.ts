import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useIsFocused } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type EarnTransactionFlow,
    type FeesRootState,
    type FormDraftRootState,
    formDraftActions,
    selectConvertedNetworkFeeInfo,
    selectFormDraft,
} from '@suite-common/wallet-core';
import {
    type FeeLevelLabel,
    type FormState,
    type GeneralPrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    type CustomFeeLevelBuilder,
    type NativeSendRootState,
    getFeeAvailability,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce, useFreshRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { deepEqual } from '@trezor/utils';

import { useComposeErrorHandler } from './useComposeErrorHandler';
import { useEarnFeeAnalytics } from './useEarnFeeAnalytics';
import { useEarnFeeEstimationError } from './useEarnFeeEstimationError';
import {
    type PreparedTxFeeToken,
    buildPreparedTxCustomFeeLevel,
    buildPreparedTxFeeDraftState,
    buildPreparedTxFeePreview,
} from '../../utils/earn/preparedTxFeeUtils';

export type ComposedTxBase = {
    symbol: NetworkSymbol;
    token: PreparedTxFeeToken;
    unsignedTransaction: string;
};

export type ComposeTxResult<TComposed extends ComposedTxBase, TReason extends string = never> =
    | { type: 'ready'; transaction: TComposed }
    | { type: 'error'; reason?: TReason }
    | { type: 'not-ready' };

export type PreparedTx<TComposed extends ComposedTxBase> = {
    amount: string;
    feePreview: PrecomposedTransactionFinal;
    transaction: TComposed;
    /** The selected fee level's transaction when available, the base one otherwise. */
    unsignedTransaction: string;
};

type BaseActionContext<TComposed extends ComposedTxBase> = {
    composeTransaction: (amount: string) => Promise<ComposeTxResult<TComposed, string>>;
    formDraftKey: string;
    amount: string;
    baseFeePreview: PrecomposedTransactionFinal;
    transaction: TComposed;
};

type UsePreparedTxFeesParams<TComposed extends ComposedTxBase, TReason extends string> = {
    amount: string | undefined;
    availableBalance?: string;
    contextKey?: string;
    analyticsFlow: EarnTransactionFlow;
    /**
     * Composes the base transaction for the debounced amount. Thrown failures use fallbackReason. Every error is surfaced as a retryable alert; a failure that only
     * disables the submit button leaves the user with no way to proceed.
     */
    composeTransaction: (amount: string) => Promise<ComposeTxResult<TComposed, TReason>>;
    onComposeError?: (reason: TReason) => void;
    fallbackReason: TReason;
    /** Empty string marks a missing draft context; the store is then only cleared, never written. */
    formDraftKey: string;
    /**
     * True when required inputs are missing — composing stops, the stored fee levels are cleared and
     * the draft is not returned. It stays stored, so the fee choice survives until the inputs are back.
     */
    hasInvalidContext: boolean;
    isEnabled: boolean;
    symbol: NetworkSymbol | undefined;
};

/**
 * Debounce-composes a transaction while the user types, re-prices it across fee levels, and
 * stores them so the shared `<FeeSelector>` can render and change them. The flow-specific part
 * (which thunk composes the transaction and what it carries) is injected via `composeTransaction`.
 */
export const usePreparedTxFees = <
    TComposed extends ComposedTxBase,
    TReason extends string = never,
>({
    amount,
    availableBalance,
    analyticsFlow,
    composeTransaction,
    formDraftKey,
    contextKey = formDraftKey,
    hasInvalidContext,
    isEnabled,
    symbol,
    onComposeError,
    fallbackReason,
}: UsePreparedTxFeesParams<TComposed, TReason>) => {
    const { dispatch } = useServices(injectDispatch);
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const { reportError: reportComposeError, resetError: resetComposeError } =
        useComposeErrorHandler({
            contextKey,
            onError: onComposeError,
        });
    const [baseActionContext, setBaseActionContext] = useState<BaseActionContext<TComposed> | null>(
        null,
    );
    const [isPreparingFee, setIsPreparingFee] = useState(false);
    const [isCustomFeeReplaced, setIsCustomFeeReplaced] = useState(false);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useEarnFeeEstimationError(contextKey);

    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, symbol),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const feeLevelsRef = useFreshRef(feeLevels);
    const storedFeeLevelsRef = useRef<GeneralPrecomposedLevels | null>(null);

    const clearFeeLevels = useCallback(() => {
        if (storedFeeLevelsRef.current && feeLevelsRef.current === storedFeeLevelsRef.current) {
            dispatch(transactionManagementActions.clearFeeLevels());
        }

        storedFeeLevelsRef.current = null;
    }, [dispatch, feeLevelsRef]);

    const failPreparation = useCallback(
        (reason?: TReason) => {
            if (reason) {
                reportComposeError(reason);
            }

            setHasFeeEstimationError(true);
            setBaseActionContext(null);
            setIsPreparingFee(false);
            clearFeeLevels();
        },
        [clearFeeLevels, reportComposeError, setHasFeeEstimationError],
    );

    const canCompose = isEnabled && !hasInvalidContext;

    const handleRetryFeeEstimation = useCallback(() => {
        resetComposeError();
        retryFeeEstimation();
    }, [resetComposeError, retryFeeEstimation]);

    const prepareBaseAction = useCallback(
        async (composeAmount: string, requestId: number) => {
            let result: ComposeTxResult<TComposed, TReason>;

            try {
                result = await composeTransaction(composeAmount);
            } catch {
                result = { type: 'error' };
            }

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (result.type === 'not-ready') {
                failPreparation();

                return;
            }

            if (result.type === 'error') {
                failPreparation(result.reason ?? fallbackReason);

                return;
            }

            const baseFeePreview = buildPreparedTxFeePreview(
                result.transaction.unsignedTransaction,
            );

            // A transaction that composed but cannot be priced is a failure, not a pending state.
            if (!baseFeePreview) {
                failPreparation(fallbackReason);

                return;
            }

            setBaseActionContext({
                composeTransaction,
                formDraftKey,
                amount: composeAmount,
                baseFeePreview,
                transaction: result.transaction,
            });
            setIsPreparingFee(false);
        },
        [composeTransaction, failPreparation, fallbackReason, formDraftKey],
    );

    const currentBaseActionContext =
        baseActionContext !== null &&
        baseActionContext.amount === amount &&
        baseActionContext.formDraftKey === formDraftKey &&
        baseActionContext.composeTransaction === composeTransaction
            ? baseActionContext
            : null;

    const feeDraftState = useMemo(() => {
        if (
            !currentBaseActionContext ||
            !feeInfo?.levels.length ||
            !currentBaseActionContext.baseFeePreview.feeLimit
        ) {
            return null;
        }

        return buildPreparedTxFeeDraftState({
            currentFormDraft: formDraft,
            availableBalance,
            amount: currentBaseActionContext.amount,
            feeInfo,
            gasLimit: currentBaseActionContext.baseFeePreview.feeLimit,
            symbol: currentBaseActionContext.transaction.symbol,
            token: currentBaseActionContext.transaction.token,
            unsignedTransaction: currentBaseActionContext.transaction.unsignedTransaction,
        });
    }, [availableBalance, currentBaseActionContext, feeInfo, formDraft]);

    const preparedTx = useMemo((): PreparedTx<TComposed> | null => {
        if (!currentBaseActionContext) {
            return null;
        }

        if (!feeDraftState && (feeInfo || formDraft)) {
            return null;
        }

        const unsignedTransaction =
            feeDraftState?.selectedFeeUnsignedTransaction ??
            currentBaseActionContext.transaction.unsignedTransaction;
        const feePreview =
            unsignedTransaction === currentBaseActionContext.transaction.unsignedTransaction
                ? currentBaseActionContext.baseFeePreview
                : buildPreparedTxFeePreview(unsignedTransaction);

        if (!feePreview) {
            return null;
        }

        return {
            amount: currentBaseActionContext.amount,
            feePreview,
            transaction: currentBaseActionContext.transaction,
            unsignedTransaction,
        };
    }, [currentBaseActionContext, feeDraftState, feeInfo, formDraft]);

    useEffect(() => {
        if (!currentBaseActionContext) {
            return;
        }

        if (!feeDraftState) {
            clearFeeLevels();

            return;
        }

        if (feeDraftState.isCustomFeeReplaced) {
            setIsCustomFeeReplaced(true);
        } else if (feeDraftState.formDraft.selectedFee !== 'normal') {
            setIsCustomFeeReplaced(false);
        }

        if (
            feeLevelsRef.current !== storedFeeLevelsRef.current ||
            !deepEqual(storedFeeLevelsRef.current, feeDraftState.feeLevels)
        ) {
            dispatch(
                transactionManagementActions.storeFeeLevels({
                    feeLevels: feeDraftState.feeLevels,
                }),
            );
            storedFeeLevelsRef.current = feeDraftState.feeLevels;
        }

        if (formDraftKey && !deepEqual(formDraft, feeDraftState.formDraft)) {
            dispatch(
                formDraftActions.storeDraft({
                    key: formDraftKey,
                    formDraft: feeDraftState.formDraft,
                }),
            );
        }
    }, [
        currentBaseActionContext,
        clearFeeLevels,
        dispatch,
        feeDraftState,
        feeLevelsRef,
        formDraft,
        formDraftKey,
    ]);

    const selectedFee: FeeLevelLabel =
        feeDraftState?.formDraft.selectedFee ?? formDraft?.selectedFee ?? 'normal';
    const localFeeLevels = feeDraftState?.feeLevels ?? {};
    const feeAvailability = getFeeAvailability({
        feeLevels: localFeeLevels,
        selectedFee,
        isLoading: isPreparingFee,
    });
    const shouldHaveFeeDraft = !!currentBaseActionContext && !isPreparingFee;
    const hasMissingFeeDraft = shouldHaveFeeDraft && !feeDraftState;
    const isFeeUnavailable = hasMissingFeeDraft || feeAvailability.isFeeUnavailable;
    const isCurrentFeePreparing =
        canCompose &&
        !!amount &&
        !hasFeeEstimationError &&
        (isPreparingFee || !currentBaseActionContext);
    const canPrepareFee = canCompose && !!amount;
    const isFeeReady = isEnabled && preparedTx?.amount === amount && !isFeeUnavailable;

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setHasFeeEstimationError(false);

        if (!canPrepareFee) {
            setBaseActionContext(null);
            setIsPreparingFee(false);

            if (hasInvalidContext) {
                clearFeeLevels();
            }

            return;
        }

        setBaseActionContext(null);
        setIsPreparingFee(true);
        void debounce(() => void prepareBaseAction(amount, requestId));
    }, [
        amount,
        canPrepareFee,
        clearFeeLevels,
        debounce,
        feeEstimationRetryKey,
        hasInvalidContext,
        prepareBaseAction,
        setHasFeeEstimationError,
    ]);

    useEffect(
        () => () => {
            requestIdRef.current += 1;
            setIsCustomFeeReplaced(false);
            clearFeeLevels();

            if (formDraftKey) {
                dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
            }
        },
        [clearFeeLevels, dispatch, formDraftKey],
    );

    const getCustomFeeLevel = useCallback<CustomFeeLevelBuilder>(
        feeLevel => {
            if (!canCompose || isCurrentFeePreparing || !currentBaseActionContext || !feeInfo) {
                return;
            }

            return buildPreparedTxCustomFeeLevel({
                availableBalance,
                currentFormDraft: {
                    selectedFee: 'custom',
                    feePerUnit: feeLevel.feePerUnit,
                    feeLimit:
                        feeLevel.feeLimit || currentBaseActionContext.baseFeePreview.feeLimit || '',
                    maxFeePerGas: feeLevel.maxFeePerGas,
                    maxPriorityFeePerGas: feeLevel.maxPriorityFeePerGas,
                },
                feeInfo,
                estimatedFeeLimit: currentBaseActionContext.baseFeePreview.feeLimit || '',
                unsignedTransaction: currentBaseActionContext.transaction.unsignedTransaction,
            });
        },
        [availableBalance, canCompose, currentBaseActionContext, feeInfo, isCurrentFeePreparing],
    );

    const onFeeConfirmed = useCallback(() => setIsCustomFeeReplaced(false), []);

    const hasFeeDraftEstimationError = canCompose && !!feeInfo && hasMissingFeeDraft;

    useEffect(() => {
        if (hasFeeDraftEstimationError) {
            reportComposeError(fallbackReason);
        } else if (feeDraftState) {
            resetComposeError();
        }
    }, [
        fallbackReason,
        feeDraftState,
        hasFeeDraftEstimationError,
        reportComposeError,
        resetComposeError,
    ]);

    const isFocused = useIsFocused();
    const hasFeeError = hasFeeEstimationError || hasFeeDraftEstimationError;
    const retryWithAnalytics = useEarnFeeAnalytics({
        contextKey,
        flow: analyticsFlow,
        networkSymbol: symbol,
        isEnabled: isFocused && canPrepareFee,
        hasEstimationError: hasFeeError,
        isFeeUnavailable,
        isReady: isFeeReady,
        retry: handleRetryFeeEstimation,
    });

    return {
        getCustomFeeLevel,
        formDraft: hasInvalidContext ? undefined : formDraft,
        formDraftKey,
        hasFeeEstimationError: hasFeeError,
        isCustomFeeReplaced,
        onFeeConfirmed,
        isFeePreparing: isCurrentFeePreparing,
        isFeeReady,
        isFeeUnavailable,
        preparedTx,
        retryFeeEstimation: retryWithAnalytics,
        selectedFee,
    };
};
