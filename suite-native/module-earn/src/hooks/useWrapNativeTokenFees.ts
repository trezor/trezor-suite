import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { WRAPPED_NATIVE, getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { composeYieldWrapTransactionThunk, updateFeeInfoThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { updateEarnSelectedFeeLevelThunk } from './useComposeEarnFees';
import { type ComposeTxResult, type ComposedTxBase, usePreparedTxFees } from './usePreparedTxFees';
import { EARN_MODULE_PREFIX } from '../constants';

export type PreparedWrapNativeTokenAction = {
    amount: string;
    unsignedTransaction: string;
};

type UseWrapNativeTokenFeesParams = {
    account: Account | null;
    amount: string | undefined;
    isEnabled: boolean;
};

const getWrapNativeTokenFormDraftKey = (accountKey: string) =>
    `${EARN_MODULE_PREFIX}/wrap-native/${accountKey}`;

/** Wrap analogue of `useYieldDepositFees` — see `usePreparedTxFees` for the shared machinery. */
export const useWrapNativeTokenFees = ({
    account,
    amount,
    isEnabled,
}: UseWrapNativeTokenFeesParams) => {
    const dispatch = useDispatch();

    const formDraftKey = useMemo(
        () => (account ? getWrapNativeTokenFormDraftKey(account.key) : ''),
        [account],
    );
    const hasInvalidContext = !amount || !account || !formDraftKey;

    const composeTransaction = useCallback(
        async (composeAmount: string): Promise<ComposeTxResult<ComposedTxBase>> => {
            const wrappedNative = account ? WRAPPED_NATIVE[account.symbol] : undefined;

            if (!account || !wrappedNative) {
                return { type: 'error', isFeeEstimationError: false };
            }

            try {
                // There is no background fee-info sync on mobile (desktop has one), so fresh
                // levels must be fetched before composing — the compose thunk reads them from
                // the store and errors with `missing-fee-level` when the network has none yet.
                await dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol })).unwrap();

                const result = await dispatch(
                    composeYieldWrapTransactionThunk({
                        account,
                        token: {
                            contractAddress: wrappedNative.address,
                            decimals: wrappedNative.decimals,
                        },
                        wrapAmount: composeAmount,
                    }),
                ).unwrap();

                if (result.type !== 'action-ready') {
                    return { type: 'error', isFeeEstimationError: true };
                }

                return {
                    type: 'ready',
                    transaction: {
                        symbol: account.symbol,
                        // Native coin of the account (`contractAddress: null`) — the token being spent.
                        token: {
                            contractAddress: null,
                            decimals: getNetwork(account.symbol).decimals,
                            symbol: getNetworkDisplaySymbol(account.symbol),
                        },
                        unsignedTransaction: result.unsignedTransaction,
                    },
                };
            } catch {
                return { type: 'error', isFeeEstimationError: true };
            }
        },
        [account, dispatch],
    );

    const fees = usePreparedTxFees({
        amount,
        composeTransaction,
        formDraftKey,
        hasInvalidContext,
        isEnabled,
        symbol: account?.symbol,
    });

    const preparedAction = useMemo(
        (): PreparedWrapNativeTokenAction | null =>
            fees.preparedTx
                ? {
                      amount: fees.preparedTx.amount,
                      unsignedTransaction: fees.preparedTx.unsignedTransaction,
                  }
                : null,
        [fees.preparedTx],
    );

    return {
        formDraft: fees.formDraft,
        formDraftKey: fees.formDraftKey,
        hasFeeEstimationError: fees.hasFeeEstimationError,
        isPreparingWrapFee: fees.isFeePreparing,
        isWrapFeeReady: fees.isFeeReady,
        preparedAction,
        retryFeeEstimation: fees.retryFeeEstimation,
        selectedFee: fees.selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
