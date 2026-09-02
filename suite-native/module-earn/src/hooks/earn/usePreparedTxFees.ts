import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    type FormDraftRootState,
    formDraftActions,
    selectConvertedNetworkFeeInfo,
    selectFormDraft,
} from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FeeLevelLabel,
    type FormState,
    type GeneralPrecomposedLevels,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    type NativeSendRootState,
    getFeeAvailability,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useDebounce } from '@trezor/react-utils';
import { deepEqual } from '@trezor/utils';

import {
    type YieldDepositFeeToken,
    buildYieldDepositFeeDraftState,
    buildYieldDepositFeePreview,
} from '../../utils/yield/yieldDepositFeeUtils';
import { useYieldFeeEstimationError } from '../yield/useYieldFeeEstimationError';

export type ComposedTxBase = {
    symbol: NetworkSymbol;
    token: YieldDepositFeeToken;
    unsignedTransaction: string;
};

export type ComposeTxResult<TComposed extends ComposedTxBase> =
    { type: 'ready'; transaction: TComposed } | { type: 'error' };

export type PreparedTx<TComposed extends ComposedTxBase> = {
    amount: string;
    feePreview: PrecomposedTransactionFinal;
    transaction: TComposed;
    /** The selected fee level's transaction when available, the base one otherwise. */
    unsignedTransaction: string;
};

type BaseActionContext<TComposed extends ComposedTxBase> = {
    amount: string;
    baseFeePreview: PrecomposedTransactionFinal;
    transaction: TComposed;
};

type UsePreparedTxFeesParams<TComposed extends ComposedTxBase> = {
    amount: string | undefined;
    /**
     * Composes the base transaction for the debounced amount. Must not throw — map failures to
     * the `error` result. Every error is surfaced as a retryable alert; a failure that only
     * disables the submit button leaves the user with no way to proceed.
     */
    composeTransaction: (amount: string) => Promise<ComposeTxResult<TComposed>>;
    /** Empty string marks a missing draft context; the store is then only cleared, never written. */
    formDraftKey: string;
    /** True when required inputs are missing — composing stops and stored drafts are cleared. */
    hasInvalidContext: boolean;
    isEnabled: boolean;
    symbol: NetworkSymbol | undefined;
};

const getFeeInfoRevision = (feeInfo: FeeInfo | null | undefined) =>
    feeInfo?.levels
        .map(({ baseFeePerGas, blocks, feePerUnit, label, maxFeePerGas, maxPriorityFeePerGas }) =>
            [label, feePerUnit, blocks, maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas].join(
                ':',
            ),
        )
        .join('|') ?? '';

/**
 * Debounce-composes a transaction while the user types, re-prices it across fee levels, and
 * stores them so the shared `<FeeSelector>` can render and change them. The flow-specific part
 * (which thunk composes the transaction and what it carries) is injected via `composeTransaction`.
 */
export const usePreparedTxFees = <TComposed extends ComposedTxBase>({
    amount,
    composeTransaction,
    formDraftKey,
    hasInvalidContext,
    isEnabled,
    symbol,
}: UsePreparedTxFeesParams<TComposed>) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [baseActionContext, setBaseActionContext] = useState<BaseActionContext<TComposed> | null>(
        null,
    );
    const [isPreparingFee, setIsPreparingFee] = useState(false);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useYieldFeeEstimationError();

    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, symbol),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const feeLevelsRef = useRef(feeLevels);
    feeLevelsRef.current = feeLevels;
    const storedFeeLevelsRef = useRef<GeneralPrecomposedLevels | null>(null);
    const feeInfoRef = useRef(feeInfo);
    feeInfoRef.current = feeInfo;
    const feeInfoRevision = useMemo(() => getFeeInfoRevision(feeInfo), [feeInfo]);

    const clearFeeLevels = useCallback(() => {
        if (storedFeeLevelsRef.current && feeLevelsRef.current === storedFeeLevelsRef.current) {
            dispatch(transactionManagementActions.clearFeeLevels());
        }

        storedFeeLevelsRef.current = null;
    }, [dispatch]);

    const clearFeeStore = useCallback(() => {
        clearFeeLevels();

        if (formDraftKey) {
            dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
        }
    }, [clearFeeLevels, dispatch, formDraftKey]);

    const clearFeeState = useCallback(() => {
        setBaseActionContext(null);
        setIsPreparingFee(false);
        clearFeeStore();
    }, [clearFeeStore]);

    const canCompose = isEnabled && !hasInvalidContext;

    const prepareBaseAction = useCallback(
        async (composeAmount: string, requestId: number) => {
            let result: ComposeTxResult<TComposed>;

            try {
                result = await composeTransaction(composeAmount);
            } catch {
                result = { type: 'error' };
            }

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (result.type !== 'ready') {
                setHasFeeEstimationError(true);
                clearFeeState();

                return;
            }

            const baseFeePreview = buildYieldDepositFeePreview(
                result.transaction.unsignedTransaction,
            );

            // A transaction that composed but cannot be priced is a failure, not a pending state.
            if (!baseFeePreview) {
                setHasFeeEstimationError(true);
                clearFeeState();

                return;
            }

            setBaseActionContext({
                amount: composeAmount,
                baseFeePreview,
                transaction: result.transaction,
            });
            setIsPreparingFee(false);
        },
        [clearFeeState, composeTransaction, setHasFeeEstimationError],
    );

    const feeDraftState = useMemo(() => {
        const currentFeeInfo = feeInfoRef.current;

        if (
            !baseActionContext ||
            !feeInfoRevision ||
            !currentFeeInfo ||
            !baseActionContext.baseFeePreview.feeLimit
        ) {
            return null;
        }

        return buildYieldDepositFeeDraftState({
            currentFormDraft: formDraft,
            amount: baseActionContext.amount,
            feeInfo: currentFeeInfo,
            gasLimit: baseActionContext.baseFeePreview.feeLimit,
            symbol: baseActionContext.transaction.symbol,
            token: baseActionContext.transaction.token,
            unsignedTransaction: baseActionContext.transaction.unsignedTransaction,
        });
    }, [baseActionContext, feeInfoRevision, formDraft]);

    const preparedTx = useMemo((): PreparedTx<TComposed> | null => {
        if (!baseActionContext) {
            return null;
        }

        if (!feeDraftState && (feeInfo || formDraft)) {
            return null;
        }

        const unsignedTransaction =
            feeDraftState?.selectedFeeUnsignedTransaction ??
            baseActionContext.transaction.unsignedTransaction;
        const feePreview =
            unsignedTransaction === baseActionContext.transaction.unsignedTransaction
                ? baseActionContext.baseFeePreview
                : buildYieldDepositFeePreview(unsignedTransaction);

        if (!feePreview) {
            return null;
        }

        return {
            amount: baseActionContext.amount,
            feePreview,
            transaction: baseActionContext.transaction,
            unsignedTransaction,
        };
    }, [baseActionContext, feeDraftState, feeInfo, formDraft]);

    useEffect(() => {
        if (!baseActionContext) {
            return;
        }

        if (!feeDraftState) {
            clearFeeLevels();

            return;
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
    }, [baseActionContext, clearFeeLevels, dispatch, feeDraftState, formDraft, formDraftKey]);

    const selectedFee: FeeLevelLabel =
        feeDraftState?.formDraft.selectedFee ?? formDraft?.selectedFee ?? 'normal';
    const localFeeLevels = feeDraftState?.feeLevels ?? {};
    const selectedFeeLevel = localFeeLevels[selectedFee];
    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
    const feeAvailability = getFeeAvailability({
        fee,
        feeLevels: localFeeLevels,
        selectedFee,
        isLoading: isPreparingFee,
    });
    const isFeeUnavailable =
        (!!baseActionContext && !feeDraftState && !isPreparingFee) ||
        feeAvailability.isFeeUnavailable;
    const isCurrentFeePreparing = canCompose && !!amount && isPreparingFee;
    const isFeeReady = isEnabled && preparedTx?.amount === amount && !isFeeUnavailable;

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setHasFeeEstimationError(false);

        if (!canCompose || !amount) {
            setBaseActionContext(null);
            setIsPreparingFee(false);

            if (hasInvalidContext) {
                clearFeeStore();
            }

            return;
        }

        setBaseActionContext(null);
        setIsPreparingFee(true);
        void debounce(() => void prepareBaseAction(amount, requestId));
    }, [
        amount,
        canCompose,
        clearFeeStore,
        debounce,
        feeEstimationRetryKey,
        hasInvalidContext,
        prepareBaseAction,
        setHasFeeEstimationError,
    ]);

    useEffect(
        () => () => {
            requestIdRef.current += 1;
            clearFeeStore();
        },
        [clearFeeStore],
    );

    return {
        formDraft,
        formDraftKey,
        hasFeeEstimationError,
        isFeePreparing: isCurrentFeePreparing,
        isFeeReady,
        isFeeUnavailable,
        preparedTx,
        retryFeeEstimation,
        selectedFee,
    };
};
