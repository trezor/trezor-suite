import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type UnsignedClaimTransaction,
    buildClaimCalldata,
    buildUnsignedClaimTransaction,
} from '@suite-common/earn-stablecoin';
import { useDispatch } from '@suite-common/redux-utils';
import { type EvmHexString } from '@suite-common/schemas/src/evm';
import { getEarnYieldClaimContractAddress, getNetwork } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    type FormDraftRootState,
    estimateYieldFeeLevel,
    ethereumGetCurrentNonceThunk,
    formDraftActions,
    selectConvertedNetworkFeeInfo,
    selectDeepCopyOfFormDraft,
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
    selectFeeLevels,
    transactionManagementActions,
} from '@suite-native/transaction-management';
import { useDebounce, useFreshRef } from '@trezor/react-utils';

import { useYieldFeeEstimationError } from './useYieldFeeEstimationError';
import {
    getYieldClaimFormDraftKey,
    updateYieldClaimSelectedFeeLevelThunk,
} from '../../thunks/yieldClaimThunks';
import { buildEarnComposeFormState } from '../../utils/earn/utils';
import { type StablecoinYieldAccountRewards } from '../../utils/yield/stablecoinYieldClaimSummaryUtils';
import { buildYieldClaimFeeLevels, getYieldClaimFee } from '../../utils/yield/yieldClaimFeeUtils';

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
    account: AccountWithNetworkType<'ethereum'>;
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
}): FormState => ({
    ...buildEarnComposeFormState(contractAddress, '0', claimCalldata),
    selectedFee: formDraft?.selectedFee ?? 'normal',
    feePerUnit: formDraft?.feePerUnit ?? '',
    feeLimit: formDraft?.feeLimit ?? '',
    maxFeePerGas: formDraft?.maxFeePerGas,
    maxPriorityFeePerGas: formDraft?.maxPriorityFeePerGas,
});

export const useYieldClaimFees = ({ accountRewards, isEnabled }: UseYieldClaimFeesParams) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const requestIdRef = useRef(0);
    const [baseContext, setBaseContext] = useState<ClaimFeeBaseContext | null>(null);
    const [isPreparingClaimFee, setIsPreparingClaimFee] = useState(false);
    const {
        feeEstimationRetryKey,
        hasFeeEstimationError,
        retryFeeEstimation,
        setHasFeeEstimationError,
    } = useYieldFeeEstimationError();
    const account = accountRewards?.account;
    const accountKey = account?.key;
    const claimFormDraftKey = useMemo(
        () => (accountKey ? getYieldClaimFormDraftKey(accountKey) : ''),
        [accountKey],
    );
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );
    const feeInfoRef = useFreshRef(feeInfo);
    const formDraft = useSelector((state: FormDraftRootState) =>
        claimFormDraftKey
            ? (selectDeepCopyOfFormDraft(state, claimFormDraftKey) as FormState | undefined)
            : undefined,
    );
    const formDraftRef = useFreshRef(formDraft);
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const selectedFee = formDraft?.selectedFee ?? 'normal';
    const selectedFeeLevel = feeLevels[selectedFee];
    const feePreview = isFinalPrecomposedTransaction(selectedFeeLevel) ? selectedFeeLevel : null;
    const { isFeeUnavailable } = getFeeAvailability({
        fee: feePreview?.fee ?? null,
        feeLevels,
        selectedFee,
        isLoading: isPreparingClaimFee,
    });

    const clearClaimFeeState = useCallback(() => {
        setBaseContext(null);
        setIsPreparingClaimFee(false);
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
        ) => {
            const currentFeeInfo = feeInfoRef.current;

            if (!currentFeeInfo || !claimFormDraftKey) {
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

                const claimFormDraft = getClaimFormDraft({
                    claimCalldata,
                    contractAddress,
                    formDraft: formDraftRef.current,
                });
                const claimFeeLevels = buildYieldClaimFeeLevels({
                    availableBalance: claimAccount.availableBalance,
                    feeInfo: currentFeeInfo,
                    formDraft: claimFormDraft,
                    gasLimit: feeLevel.payload.feeLimit,
                });

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
                    account: claimAccount,
                    chainId,
                    claimCalldata,
                    contractAddress,
                    nonce,
                    rewards,
                });
                setIsPreparingClaimFee(false);
            } catch {
                if (requestId === requestIdRef.current) {
                    clearClaimFeeState();
                }
            }
        },
        [
            claimFormDraftKey,
            clearClaimFeeState,
            dispatch,
            feeInfoRef,
            formDraftRef,
            setHasFeeEstimationError,
        ],
    );

    const prepareClaimFeeParamsRef = useFreshRef(prepareClaimFeeParams);

    // Value-stable keys of the fee preparation inputs. `prepareClaimFeeParams` gets a new identity
    // whenever `accountRewards` does (e.g. on any fiat rates update), so keying the effect on the
    // params object would keep re-running the fee preparation without its actual inputs changing.
    const claimCalldata = prepareClaimFeeParams?.claimCalldata ?? null;
    const claimContractAddress = prepareClaimFeeParams?.contractAddress ?? null;
    const claimChainId = prepareClaimFeeParams?.chainId ?? null;
    const feeInfoBlockHeight = feeInfo?.blockHeight ?? null;

    useEffect(() => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        setHasFeeEstimationError(false);

        const params = prepareClaimFeeParamsRef.current;

        if (!params) {
            clearClaimFeeState();

            return;
        }

        setBaseContext(null);
        setIsPreparingClaimFee(true);
        void debounce(() => void prepareClaimFee(params, requestId));
    }, [
        claimCalldata,
        claimChainId,
        claimContractAddress,
        clearClaimFeeState,
        debounce,
        feeEstimationRetryKey,
        feeInfoBlockHeight,
        prepareClaimFee,
        prepareClaimFeeParamsRef,
        setHasFeeEstimationError,
    ]);

    useEffect(
        () => () => {
            dispatch(transactionManagementActions.clearFeeLevels());
        },
        [dispatch],
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
        isPreparingClaimFee: !!prepareClaimFeeParams && isPreparingClaimFee,
        preparedAction,
        retryFeeEstimation,
        selectedFee,
        updateFeeLevelThunk: updateYieldClaimSelectedFeeLevelThunk,
    };
};
