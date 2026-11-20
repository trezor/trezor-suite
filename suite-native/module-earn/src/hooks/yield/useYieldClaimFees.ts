import { useCallback, useMemo } from 'react';

import {
    type UnsignedClaimTransaction,
    buildClaimCalldata,
    buildUnsignedClaimTransaction,
} from '@suite-common/earn-stablecoin';
import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import {
    getEarnYieldClaimContractAddress,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import {
    type ComposeYieldEvmTransactionErrorReason,
    type StablecoinYieldAccountRewards,
    composeYieldEvmTransactionThunk,
} from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getYieldClaimFormDraftKey } from '../../thunks/yield/yieldClaimThunks';
import { getYieldClaimFee } from '../../utils/yield/yieldClaimFeeUtils';
import { updateEarnSelectedFeeLevelThunk } from '../earn/useComposeEarnFees';
import {
    type ComposeTxResult,
    type ComposedTxBase,
    usePreparedTxFees,
} from '../earn/usePreparedTxFees';

export type PreparedYieldClaimAction = {
    feePreview: PrecomposedTransactionFinal;
    rewards: StablecoinYieldAccountRewards['rewards'];
    unsignedTransaction: UnsignedClaimTransaction;
};

type UseYieldClaimFeesParams = {
    accountRewards: StablecoinYieldAccountRewards | null;
    isEnabled: boolean;
};

export const useYieldClaimFees = ({ accountRewards, isEnabled }: UseYieldClaimFeesParams) => {
    const { dispatch } = useServices(injectDispatch);
    const account = accountRewards?.account;
    const formDraftKey = account ? getYieldClaimFormDraftKey(account.key) : '';
    const contractAddress = account ? getEarnYieldClaimContractAddress(account.symbol) : undefined;
    const claimCalldata = useMemo(() => {
        if (!accountRewards || !contractAddress || accountRewards.rewards.length === 0) {
            return null;
        }

        try {
            return buildClaimCalldata({
                senderAddress: accountRewards.account.descriptor,
                rewards: accountRewards.rewards,
            });
        } catch {
            return null;
        }
    }, [accountRewards, contractAddress]);

    const composeTransaction = useCallback(async (): Promise<
        ComposeTxResult<ComposedTxBase, ComposeYieldEvmTransactionErrorReason>
    > => {
        if (!account || !claimCalldata || !contractAddress) {
            return { type: 'error' };
        }

        const result = await dispatch(
            composeYieldEvmTransactionThunk({
                account,
                to: contractAddress,
                data: claimCalldata,
            }),
        ).unwrap();

        return result.type === 'error'
            ? result
            : {
                  type: 'ready',
                  transaction: {
                      symbol: account.symbol,
                      token: {
                          decimals: getNetwork(account.symbol).decimals,
                          symbol: getNetworkDisplaySymbol(account.symbol),
                      },
                      unsignedTransaction: result.unsignedTransaction,
                  },
              };
    }, [account, claimCalldata, contractAddress, dispatch]);

    const fees = usePreparedTxFees({
        amount: '0',
        analyticsFlow: 'merkl-claim',
        availableBalance: account?.availableBalance,
        composeTransaction,
        formDraftKey,
        hasInvalidContext: !account || !claimCalldata || !contractAddress,
        isEnabled,
        symbol: account?.symbol,
        fallbackReason: 'fee-estimation-failed',
    });

    const preparedAction = useMemo((): PreparedYieldClaimAction | null => {
        if (!accountRewards || !fees.isFeeReady || !fees.preparedTx) return null;

        const transaction = parseUnsignedEvmTransactionForSigning(
            fees.preparedTx.unsignedTransaction,
        );
        const fee = getYieldClaimFee(fees.preparedTx.feePreview);
        if (!transaction || !fee) return null;

        return {
            feePreview: fees.preparedTx.feePreview,
            rewards: accountRewards.rewards,
            unsignedTransaction: buildUnsignedClaimTransaction({
                contractAddress: transaction.to,
                data: transaction.data,
                chainId: transaction.chainId,
                nonce: transaction.nonce,
                fee,
            }),
        };
    }, [accountRewards, fees.isFeeReady, fees.preparedTx]);

    return {
        feePreview: preparedAction?.feePreview ?? null,
        formDraft: fees.formDraft,
        formDraftKey: fees.formDraftKey,
        getCustomFeeLevel: fees.getCustomFeeLevel,
        hasFeeEstimationError: fees.hasFeeEstimationError,
        isFeeUnavailable: fees.isFeeUnavailable,
        isComposingFeeLevels: fees.isFeePreparing,
        preparedAction,
        retryFeeEstimation: fees.retryFeeEstimation,
        selectedFee: fees.selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
