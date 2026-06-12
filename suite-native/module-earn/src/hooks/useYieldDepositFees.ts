import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type FeesRootState,
    type FormDraftRootState,
    composeYieldDepositTransactionThunk,
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

import { updateEarnSelectedFeeLevelThunk } from './useComposeEarnFees';
import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { getYieldDepositFormDraftKey } from '../utils/yieldDepositUtils';
import {
    buildYieldDepositFeeDraftState,
    buildYieldDepositFeePreview,
} from '../yieldDepositFeeUtils';

export type PreparedYieldDepositAction = {
    amount: string;
    feePreview: PrecomposedTransactionFinal;
    receiptAmount: string;
    unsignedTransaction: string;
};

type UseYieldDepositFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    isEnabled: boolean;
};

type BaseYieldDepositActionContext = {
    amount: string;
    baseFeePreview: PrecomposedTransactionFinal;
    receiptAmount: string;
    symbol: NonNullable<ResolvedYieldFlowData['flowData']>['account']['symbol'];
    token: NonNullable<ResolvedYieldFlowData['flowData']>['token'];
    unsignedTransaction: string;
};

type ComposeDepositBaseActionParams = {
    amount: string;
    flowData: NonNullable<ResolvedYieldFlowData['flowData']>;
};

const getYieldDepositFeeInfoRevision = (feeInfo: FeeInfo | null | undefined) =>
    feeInfo?.levels
        .map(({ baseFeePerGas, blocks, feePerUnit, label, maxFeePerGas, maxPriorityFeePerGas }) =>
            [label, feePerUnit, blocks, maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas].join(
                ':',
            ),
        )
        .join('|') ?? '';

export const useYieldDepositFees = ({
    amount,
    flowData,
    flowKey,
    isEnabled,
}: UseYieldDepositFeesParams) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [baseActionContext, setBaseActionContext] =
        useState<BaseYieldDepositActionContext | null>(null);
    const [isPreparingDepositFee, setIsPreparingDepositFee] = useState(false);

    const formDraftKey = useMemo(
        () => (flowKey ? getYieldDepositFormDraftKey(flowKey) : ''),
        [flowKey],
    );
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, flowData?.account.symbol),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const feeLevelsRef = useRef(feeLevels);
    feeLevelsRef.current = feeLevels;
    const storedDepositFeeLevelsRef = useRef<GeneralPrecomposedLevels | null>(null);
    const feeInfoRef = useRef(feeInfo);
    feeInfoRef.current = feeInfo;
    const feeInfoRevision = useMemo(() => getYieldDepositFeeInfoRevision(feeInfo), [feeInfo]);

    const clearDepositFeeLevels = useCallback(() => {
        if (
            storedDepositFeeLevelsRef.current &&
            feeLevelsRef.current === storedDepositFeeLevelsRef.current
        ) {
            dispatch(transactionManagementActions.clearFeeLevels());
        }

        storedDepositFeeLevelsRef.current = null;
    }, [dispatch]);

    const clearDepositFeeStore = useCallback(() => {
        clearDepositFeeLevels();

        if (formDraftKey) {
            dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
        }
    }, [clearDepositFeeLevels, dispatch, formDraftKey]);

    const clearDepositFeeState = useCallback(() => {
        setBaseActionContext(null);
        setIsPreparingDepositFee(false);
        clearDepositFeeStore();
    }, [clearDepositFeeStore]);

    const hasInvalidDepositContext = !amount || !flowData || !flowKey || !formDraftKey;

    const composeDepositBaseActionParams = useMemo((): ComposeDepositBaseActionParams | null => {
        if (hasInvalidDepositContext || !isEnabled) {
            return null;
        }

        return { amount, flowData };
    }, [amount, flowData, hasInvalidDepositContext, isEnabled]);

    const prepareDepositBaseAction = useCallback(
        async (
            { amount: preparedAmount, flowData: preparedFlowData }: ComposeDepositBaseActionParams,
            requestId: number,
        ) => {
            try {
                const result = await dispatch(
                    composeYieldDepositTransactionThunk({
                        amount: preparedAmount,
                        flowData: preparedFlowData,
                    }),
                ).unwrap();

                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (result.type !== 'action-ready') {
                    clearDepositFeeState();

                    return;
                }

                const baseFeePreview = buildYieldDepositFeePreview(result.unsignedTransaction);

                if (!baseFeePreview) {
                    clearDepositFeeState();

                    return;
                }

                setBaseActionContext({
                    amount: preparedAmount,
                    baseFeePreview,
                    receiptAmount: result.receiptAmount,
                    symbol: preparedFlowData.account.symbol,
                    token: preparedFlowData.token,
                    unsignedTransaction: result.unsignedTransaction,
                });
                setIsPreparingDepositFee(false);
            } catch {
                if (requestId === requestIdRef.current) {
                    clearDepositFeeState();
                }
            }
        },
        [clearDepositFeeState, dispatch],
    );

    const depositFeeDraftState = useMemo(() => {
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
            symbol: baseActionContext.symbol,
            token: baseActionContext.token,
            unsignedTransaction: baseActionContext.unsignedTransaction,
        });
    }, [baseActionContext, feeInfoRevision, formDraft]);

    const preparedAction = useMemo((): PreparedYieldDepositAction | null => {
        if (!baseActionContext) {
            return null;
        }

        if (!depositFeeDraftState && (feeInfo || formDraft)) {
            return null;
        }

        const unsignedTransaction =
            depositFeeDraftState?.selectedFeeUnsignedTransaction ??
            baseActionContext.unsignedTransaction;
        const feePreview =
            unsignedTransaction === baseActionContext.unsignedTransaction
                ? baseActionContext.baseFeePreview
                : buildYieldDepositFeePreview(unsignedTransaction);

        if (!feePreview) {
            return null;
        }

        return {
            amount: baseActionContext.amount,
            feePreview,
            receiptAmount: baseActionContext.receiptAmount,
            unsignedTransaction,
        };
    }, [baseActionContext, depositFeeDraftState, feeInfo, formDraft]);

    useEffect(() => {
        if (!baseActionContext) {
            return;
        }

        if (!depositFeeDraftState) {
            clearDepositFeeLevels();

            return;
        }

        if (
            feeLevelsRef.current !== storedDepositFeeLevelsRef.current ||
            !deepEqual(storedDepositFeeLevelsRef.current, depositFeeDraftState.feeLevels)
        ) {
            dispatch(
                transactionManagementActions.storeFeeLevels({
                    feeLevels: depositFeeDraftState.feeLevels,
                }),
            );
            storedDepositFeeLevelsRef.current = depositFeeDraftState.feeLevels;
        }

        if (formDraftKey && !deepEqual(formDraft, depositFeeDraftState.formDraft)) {
            dispatch(
                formDraftActions.storeDraft({
                    key: formDraftKey,
                    formDraft: depositFeeDraftState.formDraft,
                }),
            );
        }
    }, [
        baseActionContext,
        clearDepositFeeLevels,
        depositFeeDraftState,
        dispatch,
        formDraft,
        formDraftKey,
    ]);

    const selectedFee: FeeLevelLabel =
        depositFeeDraftState?.formDraft.selectedFee ?? formDraft?.selectedFee ?? 'normal';
    const localFeeLevels = depositFeeDraftState?.feeLevels ?? {};
    const selectedFeeLevel = localFeeLevels[selectedFee];
    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
    const feeAvailability = getFeeAvailability({
        fee,
        feeLevels: localFeeLevels,
        selectedFee,
        isLoading: isPreparingDepositFee,
    });
    const isFeeUnavailable =
        (!!baseActionContext && !depositFeeDraftState && !isPreparingDepositFee) ||
        feeAvailability.isFeeUnavailable;
    const isCurrentDepositFeePreparing = !!composeDepositBaseActionParams && isPreparingDepositFee;
    const isDepositFeeReady = isEnabled && preparedAction?.amount === amount && !isFeeUnavailable;

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!composeDepositBaseActionParams) {
            setBaseActionContext(null);
            setIsPreparingDepositFee(false);

            if (hasInvalidDepositContext) {
                clearDepositFeeStore();
            }

            return;
        }

        setBaseActionContext(null);
        setIsPreparingDepositFee(true);
        void debounce(
            () => void prepareDepositBaseAction(composeDepositBaseActionParams, requestId),
        );
    }, [
        clearDepositFeeStore,
        composeDepositBaseActionParams,
        debounce,
        hasInvalidDepositContext,
        prepareDepositBaseAction,
    ]);

    useEffect(
        () => () => {
            requestIdRef.current += 1;
            clearDepositFeeStore();
        },
        [clearDepositFeeStore],
    );

    return {
        feePreview: preparedAction?.feePreview ?? null,
        formDraft,
        formDraftKey,
        isDepositFeeReady,
        isFeeUnavailable,
        isPreparingDepositFee: isCurrentDepositFeePreparing,
        preparedAction,
        selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
