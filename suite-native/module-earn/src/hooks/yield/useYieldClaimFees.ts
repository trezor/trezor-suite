import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type UnsignedClaimTransaction,
    buildClaimCalldata,
    buildUnsignedClaimTransaction,
} from '@suite-common/earn-stablecoin';
import { type EvmHexString } from '@suite-common/schemas/src/evm';
import { getEarnYieldClaimContractAddress, getNetwork } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    type FormDraftRootState,
    type StablecoinYieldAccountRewards,
    estimateYieldFeeLevel,
    ethereumGetCurrentNonceThunk,
    formDraftActions,
    selectAreFeesLoading,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
    selectFormDraft,
} from '@suite-common/wallet-core';
import {
    type AccountWithNetworkType,
    type FormState,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    type NativeSendRootState,
    getFeeAvailability,
    isPrecomposedTransactionError,
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce, useFreshRef } from '@trezor/react-utils';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { getYieldClaimFormDraftKey } from '../../thunks/yield/yieldClaimThunks';
import { getFeeInfoRevision } from '../../utils/earn/getFeeInfoRevision';
import { buildEarnComposeFormState } from '../../utils/earn/utils';
import { buildYieldClaimFeeLevels, getYieldClaimFee } from '../../utils/yield/yieldClaimFeeUtils';
import { updateEarnSelectedFeeLevelThunk } from '../earn/useComposeEarnFees';
import { useEarnFeeEstimationError } from '../earn/useEarnFeeEstimationError';

export type PreparedYieldClaimAction = {
    feePreview: PrecomposedTransactionFinal;
    rewards: StablecoinYieldAccountRewards['rewards'];
    unsignedTransaction: UnsignedClaimTransaction;
};

type UseYieldClaimFeesParams = {
    accountRewards: StablecoinYieldAccountRewards | null;
    isEnabled: boolean;
};

type ClaimFeeBaseContext = {
    preparationKey: string;
    chainId: number;
    claimCalldata: EvmHexString;
    contractAddress: EvmHexString;
    nonce: string;
    rewards: StablecoinYieldAccountRewards['rewards'];
};

type PrepareClaimFeeParams = {
    account: AccountWithNetworkType<'ethereum'>;
    chainId: number;
    claimCalldata: EvmHexString;
    contractAddress: EvmHexString;
    rewards: StablecoinYieldAccountRewards['rewards'];
};

const getClaimFormDraft = ({
    claimCalldata,
    contractAddress,
    formDraft,
}: Pick<PrepareClaimFeeParams, 'claimCalldata' | 'contractAddress'> & {
    formDraft: FormState | undefined;
}): FormState => {
    const currentDraft = formDraft?.transactionData === claimCalldata ? formDraft : undefined;

    return {
        ...buildEarnComposeFormState(contractAddress, '0', claimCalldata),
        selectedFee: currentDraft?.selectedFee ?? 'normal',
        feePerUnit: currentDraft?.feePerUnit ?? '',
        feeLimit: currentDraft?.feeLimit ?? '',
        maxFeePerGas: currentDraft?.maxFeePerGas,
        maxPriorityFeePerGas: currentDraft?.maxPriorityFeePerGas,
    };
};

export const useYieldClaimFees = ({ accountRewards, isEnabled }: UseYieldClaimFeesParams) => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [baseContext, setBaseContext] = useState<ClaimFeeBaseContext | null>(null);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useEarnFeeEstimationError();
    const account = accountRewards?.account;
    const accountKey = account?.key;
    const claimFormDraftKey = useMemo(
        () => (accountKey ? getYieldClaimFormDraftKey(accountKey) : ''),
        [accountKey],
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );
    const areNetworkFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );
    const isWaitingForNetworkFees = areNetworkFeesLoading && !feeInfo?.levels.length;
    const formDraft = useSelector((state: FormDraftRootState) =>
        claimFormDraftKey ? selectFormDraft<FormState>(state, claimFormDraftKey) : undefined,
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const selectedFee = formDraft?.selectedFee ?? 'normal';
    const selectedFeeLevel = feeLevels[selectedFee];
    const clearClaimFeeState = useCallback(() => {
        setBaseContext(null);
        dispatch(transactionManagementActions.clearFeeLevels());
    }, [dispatch]);

    const prepareClaimFeeParams = useMemo((): PrepareClaimFeeParams | null => {
        if (!isEnabled || !accountRewards || accountRewards.rewards.length === 0) {
            return null;
        }

        const network = getNetwork(accountRewards.account.symbol);
        const contractAddress = getEarnYieldClaimContractAddress(accountRewards.account.symbol);

        if (
            accountRewards.account.networkType !== 'ethereum' ||
            !network.chainId ||
            !contractAddress
        ) {
            return null;
        }

        try {
            return {
                account: accountRewards.account,
                chainId: network.chainId,
                claimCalldata: buildClaimCalldata({
                    senderAddress: accountRewards.account.descriptor,
                    rewards: accountRewards.rewards,
                }),
                contractAddress,
                rewards: accountRewards.rewards,
            };
        } catch {
            return null;
        }
    }, [accountRewards, isEnabled]);

    const prepareClaimFee = useCallback(
        async (
            {
                account: claimAccount,
                chainId,
                claimCalldata,
                contractAddress,
                rewards,
            }: PrepareClaimFeeParams,
            requestId: number,
            preparationKey: string,
        ) => {
            if (requestId !== requestIdRef.current) return;

            const currentFeeInfo = selectConvertedNetworkFeeInfo(getState(), claimAccount.symbol);

            if (!currentFeeInfo || !claimFormDraftKey) {
                setHasFeeEstimationError(true);
                clearClaimFeeState();

                return;
            }

            try {
                const feeLevelTask = estimateYieldFeeLevel({
                    coin: claimAccount.symbol,
                    identity: claimAccount.deviceState,
                    from: claimAccount.descriptor,
                    to: contractAddress,
                    data: claimCalldata,
                });
                const nonceTask = dispatch(
                    ethereumGetCurrentNonceThunk({
                        selectedAccount: claimAccount,
                        fetchConfirmedNonce: true,
                    }),
                ).unwrap();

                const [feeLevel, { nonce }] = await Promise.all([feeLevelTask, nonceTask]);

                if (requestId !== requestIdRef.current) {
                    return;
                }

                if (!feeLevel.success) {
                    setHasFeeEstimationError(true);
                    clearClaimFeeState();

                    return;
                }

                const currentDraft = selectDeepCopyOfFormDraft(getState(), claimFormDraftKey) as
                    FormState | undefined;
                const claimFormDraft = {
                    ...getClaimFormDraft({
                        claimCalldata,
                        contractAddress,
                        formDraft: currentDraft,
                    }),
                    estimatedFeeLimit: feeLevel.payload.feeLimit,
                };
                const claimFeeLevels = buildYieldClaimFeeLevels({
                    availableBalance: claimAccount.availableBalance,
                    feeInfo: currentFeeInfo,
                    formDraft: claimFormDraft,
                    gasLimit: feeLevel.payload.feeLimit,
                });

                const hasFeeResult = Object.values(claimFeeLevels).some(
                    level =>
                        isFinalPrecomposedTransaction(level) ||
                        (level.type === 'error' && isPrecomposedTransactionError(level.error)),
                );
                if (!hasFeeResult) {
                    setHasFeeEstimationError(true);
                    clearClaimFeeState();

                    return;
                }

                dispatch(
                    transactionManagementActions.storeFeeLevels({ feeLevels: claimFeeLevels }),
                );
                dispatch(
                    formDraftActions.storeDraft({
                        key: claimFormDraftKey,
                        formDraft: claimFormDraft,
                    }),
                );
                setBaseContext({
                    preparationKey,
                    chainId,
                    claimCalldata,
                    contractAddress,
                    nonce,
                    rewards,
                });
            } catch {
                if (requestId === requestIdRef.current) {
                    setHasFeeEstimationError(true);
                    clearClaimFeeState();
                }
            }
        },
        [claimFormDraftKey, clearClaimFeeState, dispatch, getState, setHasFeeEstimationError],
    );

    const prepareClaimFeeParamsRef = useFreshRef(prepareClaimFeeParams);

    // Compare actual preparation inputs; rewards objects also change on unrelated fiat updates.
    const preparationKey = prepareClaimFeeParams
        ? JSON.stringify([
              accountKey,
              account?.availableBalance,
              prepareClaimFeeParams.chainId,
              prepareClaimFeeParams.claimCalldata,
              prepareClaimFeeParams.contractAddress,
              feeInfo?.blockHeight,
              getFeeInfoRevision(feeInfo),
          ])
        : null;
    const isComposingFeeLevels =
        preparationKey !== null &&
        !hasFeeEstimationError &&
        (isWaitingForNetworkFees || baseContext?.preparationKey !== preparationKey);
    const { isFeeUnavailable } = getFeeAvailability({
        feeLevels,
        selectedFee,
        isLoading: isComposingFeeLevels,
    });
    const feePreview =
        baseContext?.preparationKey === preparationKey &&
        !isComposingFeeLevels &&
        isFinalPrecomposedTransaction(selectedFeeLevel)
            ? selectedFeeLevel
            : null;

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setHasFeeEstimationError(false);

        const params = prepareClaimFeeParamsRef.current;

        if (!params || !preparationKey) {
            clearClaimFeeState();

            return;
        }

        setBaseContext(null);
        dispatch(transactionManagementActions.clearFeeLevels());
        if (isWaitingForNetworkFees) return;

        void debounce(() => void prepareClaimFee(params, requestId, preparationKey));
    }, [
        isWaitingForNetworkFees,
        clearClaimFeeState,
        debounce,
        dispatch,
        feeEstimationRetryKey,
        prepareClaimFee,
        prepareClaimFeeParamsRef,
        preparationKey,
        setHasFeeEstimationError,
    ]);

    useEffect(
        () => () => {
            requestIdRef.current += 1;
            dispatch(transactionManagementActions.clearFeeLevels());
            if (claimFormDraftKey) {
                dispatch(formDraftActions.removeDraft({ key: claimFormDraftKey }));
            }
        },
        [claimFormDraftKey, dispatch],
    );

    const preparedAction = useMemo((): PreparedYieldClaimAction | null => {
        if (!baseContext || !feePreview) {
            return null;
        }

        const fee = getYieldClaimFee(feePreview);

        if (!fee) {
            return null;
        }

        return {
            feePreview,
            rewards: baseContext.rewards,
            unsignedTransaction: buildUnsignedClaimTransaction({
                contractAddress: baseContext.contractAddress,
                data: baseContext.claimCalldata,
                chainId: baseContext.chainId,
                fee,
                nonce: baseContext.nonce,
            }),
        };
    }, [baseContext, feePreview]);

    return {
        feePreview,
        formDraft,
        formDraftKey: claimFormDraftKey,
        hasFeeEstimationError,
        isFeeUnavailable,
        isComposingFeeLevels,
        preparedAction,
        retryFeeEstimation,
        selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
