import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { asEvmAddress } from '@suite-common/calldata';
import { buildStablecoinYieldTransactionReview } from '@suite-common/earn-stablecoin/src/signing';
import { getNetwork } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import {
    type FeesRootState,
    type FormDraftRootState,
    type YieldWithdrawInputUnit,
    buildEvmSelectedFee,
    buildYieldWithdrawCalldata,
    buildYieldWithdrawUnsignedTransaction,
    ethereumGetCurrentNonceThunk,
    formDraftActions,
    selectConvertedNetworkFeeInfo,
    selectFormDraft,
} from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedLevels,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import {
    type NativeSendRootState,
    getFeeAvailability,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import TrezorConnect from '@trezor/connect';
import { useDebounce } from '@trezor/react-utils';

import { updateEarnSelectedFeeLevelThunk } from './useComposeEarnFees';
import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import {
    getYieldWithdrawFormDraftKey,
    getYieldWithdrawInputToken,
} from '../utils/yieldWithdrawUtils';

type UseYieldWithdrawFeesParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string;
    isEnabled: boolean;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

type PreparedYieldWithdrawAction = {
    amount: string;
    unsignedTransaction: string;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

type WithdrawFlowData = NonNullable<ResolvedYieldFlowData['flowData']>;

type UseYieldWithdrawFeesResult = {
    fee: string | null;
    formDraft: FormState | undefined;
    formDraftKey: string;
    isComposingWithdrawFee: boolean;
    isFeeUnavailable: boolean;
    preparedAction: PreparedYieldWithdrawAction | null;
    selectedFee: FeeLevelLabel;
    updateFeeLevelThunk: typeof updateEarnSelectedFeeLevelThunk;
};

// Only the inputs that should trigger a fresh (network) fee composition. The fee context
// (feeInfo, selected/custom fee, flowData) is read from refs at compose time instead, so it can't
// re-trigger the effect — most importantly the fee draft that the compose itself writes.
type ComposeWithdrawFeeParams = {
    amount: string;
    formDraftKey: string;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

type ComposeYieldWithdrawTransactionParams = {
    amount: string;
    dispatch: ReturnType<typeof useDispatch>;
    feeInfo: FeeInfo;
    flowData: WithdrawFlowData;
    withdrawInputUnit: YieldWithdrawInputUnit;
};

type BuildYieldWithdrawFeeLevelsParams = {
    amount: string;
    feeInfo: FeeInfo;
    gasLimit: string;
    reviewToken: WithdrawFlowData['receiptToken'];
    symbol: WithdrawFlowData['account']['symbol'];
    unsignedTransaction: string;
};

const FEE_LEVEL_LABELS_BY_PRICE: FeeLevelLabel[] = ['economy', 'low', 'normal', 'high'];

const getFeeLevelForUnsignedTransaction = (feeInfo: FeeInfo) =>
    FEE_LEVEL_LABELS_BY_PRICE.map(label =>
        feeInfo.levels.find(level => level.label === label),
    ).find(level => level !== undefined) ?? feeInfo.levels[0];

const getYieldWithdrawFeeState = (formDraft: FormState | null | undefined) => {
    const selectedFee: FeeLevelLabel =
        formDraft?.selectedFee === 'custom' && (!formDraft.feeLimit || !formDraft.feePerUnit)
            ? 'normal'
            : (formDraft?.selectedFee ?? 'normal');

    if (selectedFee !== 'custom' || !formDraft?.feeLimit || !formDraft.feePerUnit) {
        return {
            customFee: undefined,
            selectedFee,
        };
    }

    return {
        customFee: {
            feeLimit: formDraft.feeLimit,
            feePerUnit: formDraft.feePerUnit,
            maxFeePerGas: formDraft.maxFeePerGas,
            maxPriorityFeePerGas: formDraft.maxPriorityFeePerGas,
        },
        selectedFee,
    };
};

const getWithdrawFeeInfoRevision = (feeInfo: FeeInfo | null | undefined) =>
    feeInfo?.levels
        .map(({ baseFeePerGas, blocks, feePerUnit, label, maxFeePerGas, maxPriorityFeePerGas }) =>
            [label, feePerUnit, blocks, maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas].join(
                ':',
            ),
        )
        .join('|') ?? '';

const isWithdrawFeeInfoReady = (feeInfo: FeeInfo | null | undefined) =>
    !!feeInfo?.levels.some(
        feeLevel => feeLevel.label !== 'normal' || feeLevel.maxFeePerGas || feeLevel.blocks !== -1,
    );

const composeYieldWithdrawTransaction = async ({
    amount,
    dispatch,
    feeInfo,
    flowData,
    withdrawInputUnit,
}: ComposeYieldWithdrawTransactionParams) => {
    const { account, receiptToken, vault } = flowData;

    if (account.networkType !== 'ethereum') {
        throw new Error('Yield withdraw supports only EVM accounts.');
    }

    const vaultAddress = receiptToken.contractAddress ?? vault.outputToken?.address;
    const network = getNetwork(account.symbol);

    if (!vaultAddress || !network.chainId || vault.chainId !== network.chainId) {
        throw new Error('Yield withdraw cannot be composed for this vault.');
    }

    const ownerAddress = asEvmAddress(account.descriptor);
    const calldata = buildYieldWithdrawCalldata({
        amount,
        flowData,
        ownerAddress,
        receiverAddress: ownerAddress,
        withdrawInputUnit,
    });

    const [{ nonce }, estimatedFee] = await Promise.all([
        dispatch(ethereumGetCurrentNonceThunk({ selectedAccount: account })).unwrap(),
        TrezorConnect.blockchainEstimateFee({
            coin: account.symbol,
            identity: getAccountIdentity(account),
            request: {
                blocks: [2],
                specific: {
                    from: account.descriptor,
                    to: vaultAddress,
                    data: calldata,
                    value: '0x0',
                },
            },
        }),
    ]);
    const estimatedGasLimit = estimatedFee.success
        ? estimatedFee.payload.levels[0]?.feeLimit
        : undefined;
    const feeLevel = getFeeLevelForUnsignedTransaction(feeInfo);

    if (!feeLevel) {
        throw new Error('Fee info is not available.');
    }

    const unsignedTransaction = buildYieldWithdrawUnsignedTransaction({
        chainId: network.chainId,
        data: calldata,
        feeLevel,
        from: account.descriptor,
        gasLimit: estimatedGasLimit ?? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
        nonce: Number(nonce),
        to: vaultAddress,
    });

    return JSON.stringify(unsignedTransaction);
};

const buildYieldWithdrawFeeLevels = ({
    amount,
    feeInfo,
    gasLimit,
    reviewToken,
    symbol,
    unsignedTransaction,
}: BuildYieldWithdrawFeeLevelsParams): PrecomposedLevels =>
    Object.fromEntries(
        feeInfo.levels
            .filter(feeLevel => feeLevel.label !== 'custom')
            .map(feeLevel => {
                const { precomposedTransaction } = buildStablecoinYieldTransactionReview({
                    amount,
                    selectedFee: buildEvmSelectedFee({ feeLevel, gasLimit }),
                    symbol,
                    token: reviewToken,
                    unsignedTransaction,
                });

                return [feeLevel.label, precomposedTransaction];
            }),
    );

export const useYieldWithdrawFees = ({
    amount,
    flowData,
    flowKey,
    isEnabled,
    withdrawInputUnit,
}: UseYieldWithdrawFeesParams): UseYieldWithdrawFeesResult => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [preparedAction, setPreparedAction] = useState<PreparedYieldWithdrawAction | null>(null);
    const [isComposingWithdrawFee, setIsComposingWithdrawFee] = useState(false);

    const formDraftKey = useMemo(
        () => (flowKey ? getYieldWithdrawFormDraftKey(flowKey) : ''),
        [flowKey],
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, flowData?.account.symbol),
    );
    const formDraft = useSelector((state: FormDraftRootState) =>
        formDraftKey ? selectFormDraft<FormState>(state, formDraftKey) : undefined,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));

    const feeState = useMemo(() => getYieldWithdrawFeeState(formDraft), [formDraft]);
    const { selectedFee } = feeState;

    // Latest fee context kept in refs so the compose effect can read it without re-running when it
    // changes (which would otherwise loop: compose -> stores draft -> draft change -> compose ...).
    const flowDataRef = useRef(flowData);
    flowDataRef.current = flowData;
    const feeInfoRef = useRef(feeInfo);
    feeInfoRef.current = feeInfo;
    const feeStateRef = useRef(feeState);
    feeStateRef.current = feeState;
    const selectedFeeLevel = feeLevels[selectedFee];
    const fee = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel.fee : null;
    const { isFeeUnavailable } = getFeeAvailability({
        fee,
        feeLevels,
        selectedFee,
        isLoading: isComposingWithdrawFee,
    });

    // `formDraftKey` is truthy only once the flow is resolved (so flowData is available), and
    // `hasFeeInfo` flips compose back on when fee info finishes loading without re-triggering on
    // every fee-info identity change.
    const feeInfoRevision = useMemo(() => getWithdrawFeeInfoRevision(feeInfo), [feeInfo]);
    const hasFeeInfo = isWithdrawFeeInfoReady(feeInfo);
    const composeWithdrawFee = useCallback(
        async (params: ComposeWithdrawFeeParams, requestId: number) => {
            const { amount: withdrawAmount, formDraftKey: withdrawFormDraftKey } = params;
            const withdrawFlowData = flowDataRef.current;
            const withdrawFeeInfo = feeInfoRef.current;
            const currentWithdrawInputUnit = params.withdrawInputUnit;
            const { customFee: withdrawCustomFee, selectedFee: withdrawSelectedFee } =
                feeStateRef.current;

            if (!withdrawFlowData || !withdrawFeeInfo) {
                if (requestId === requestIdRef.current) {
                    dispatch(formDraftActions.removeDraft({ key: withdrawFormDraftKey }));
                    setPreparedAction(null);
                    setIsComposingWithdrawFee(false);
                }

                return;
            }

            try {
                if (requestId !== requestIdRef.current) {
                    return;
                }

                const unsignedTransaction = await composeYieldWithdrawTransaction({
                    amount: withdrawAmount,
                    dispatch,
                    feeInfo: withdrawFeeInfo,
                    flowData: withdrawFlowData,
                    withdrawInputUnit: currentWithdrawInputUnit,
                });

                if (requestId !== requestIdRef.current) {
                    return;
                }

                const reviewToken = getYieldWithdrawInputToken({
                    flowData: withdrawFlowData,
                    withdrawInputUnit: currentWithdrawInputUnit,
                });
                const { formState: baseFormState } = buildStablecoinYieldTransactionReview({
                    amount: withdrawAmount,
                    selectedFee: null,
                    symbol: withdrawFlowData.account.symbol,
                    token: reviewToken,
                    unsignedTransaction,
                });
                const withdrawFeeLevels = buildYieldWithdrawFeeLevels({
                    amount: withdrawAmount,
                    feeInfo: withdrawFeeInfo,
                    gasLimit: baseFormState.feeLimit,
                    reviewToken,
                    symbol: withdrawFlowData.account.symbol,
                    unsignedTransaction,
                });
                const mergedFormState = {
                    ...baseFormState,
                    selectedFee: withdrawSelectedFee,
                    feePerUnit: withdrawCustomFee?.feePerUnit ?? baseFormState.feePerUnit,
                    feeLimit: withdrawCustomFee?.feeLimit ?? baseFormState.feeLimit,
                    maxFeePerGas: withdrawCustomFee?.maxFeePerGas ?? baseFormState.maxFeePerGas,
                    maxPriorityFeePerGas:
                        withdrawCustomFee?.maxPriorityFeePerGas ??
                        baseFormState.maxPriorityFeePerGas,
                };

                dispatch(
                    transactionManagementActions.storeFeeLevels({ feeLevels: withdrawFeeLevels }),
                );

                const resolvedSelectedFee = isFinalPrecomposedTransaction(
                    withdrawFeeLevels[mergedFormState.selectedFee],
                )
                    ? mergedFormState.selectedFee
                    : FEE_LEVEL_LABELS_BY_PRICE.find(label =>
                          isFinalPrecomposedTransaction(withdrawFeeLevels[label]),
                      );
                const selectedFeeTransaction = resolvedSelectedFee
                    ? withdrawFeeLevels[resolvedSelectedFee]
                    : undefined;

                if (!isFinalPrecomposedTransaction(selectedFeeTransaction)) {
                    dispatch(formDraftActions.removeDraft({ key: withdrawFormDraftKey }));
                    setPreparedAction(null);

                    return;
                }

                dispatch(
                    formDraftActions.storeDraft({
                        key: withdrawFormDraftKey,
                        formDraft: {
                            ...mergedFormState,
                            selectedFee: resolvedSelectedFee,
                            feePerUnit: selectedFeeTransaction.feePerByte,
                            feeLimit: selectedFeeTransaction.feeLimit,
                            maxFeePerGas: selectedFeeTransaction.maxFeePerGas,
                            maxPriorityFeePerGas: selectedFeeTransaction.maxPriorityFeePerGas,
                        },
                    }),
                );
                setPreparedAction({
                    amount: withdrawAmount,
                    unsignedTransaction,
                    withdrawInputUnit: currentWithdrawInputUnit,
                });
            } catch {
                if (requestId === requestIdRef.current) {
                    dispatch(formDraftActions.removeDraft({ key: withdrawFormDraftKey }));
                    setPreparedAction(null);
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsComposingWithdrawFee(false);
                }
            }
        },
        [dispatch],
    );

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!isEnabled || !amount || !formDraftKey || !hasFeeInfo) {
            setIsComposingWithdrawFee(false);
            setPreparedAction(null);

            if (!amount && formDraftKey) {
                dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
            }

            return;
        }

        setIsComposingWithdrawFee(true);
        debounce(
            () =>
                void composeWithdrawFee(
                    {
                        amount,
                        formDraftKey,
                        withdrawInputUnit,
                    },
                    requestId,
                ),
        );
    }, [
        amount,
        composeWithdrawFee,
        debounce,
        dispatch,
        feeInfoRevision,
        formDraftKey,
        hasFeeInfo,
        isEnabled,
        withdrawInputUnit,
    ]);

    return {
        fee,
        formDraft,
        formDraftKey,
        isComposingWithdrawFee,
        isFeeUnavailable,
        preparedAction,
        selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
