import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type WrappedNativeFlowType,
    composeYieldUnwrapTransactionThunk,
    composeYieldWrapTransactionThunk,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import { updateEarnSelectedFeeLevelThunk } from './useComposeEarnFees';
import { type ComposeTxResult, type ComposedTxBase, usePreparedTxFees } from './usePreparedTxFees';
import { EARN_MODULE_PREFIX } from '../constants';

export type PreparedWrappedNativeTokenAction = {
    amount: string;
    unsignedTransaction: string;
};

type UseWrappedNativeTokenFeesParams = {
    account: Account | null;
    amount: string | undefined;
    flowType: WrappedNativeFlowType;
    isEnabled: boolean;
};

const getWrappedNativeTokenFormDraftKey = (flowType: WrappedNativeFlowType, accountKey: string) =>
    `${EARN_MODULE_PREFIX}/${flowType === 'wrap' ? 'wrap-native' : 'unwrap-native'}/${accountKey}`;

export const useWrappedNativeTokenFees = ({
    account,
    amount,
    flowType,
    isEnabled,
}: UseWrappedNativeTokenFeesParams) => {
    const dispatch = useDispatch();

    const formDraftKey = useMemo(
        () => (account ? getWrappedNativeTokenFormDraftKey(flowType, account.key) : ''),
        [account, flowType],
    );
    const hasInvalidContext = !amount || !account || !formDraftKey;

    const composeTransaction = useCallback(
        async (composeAmount: string): Promise<ComposeTxResult<ComposedTxBase>> => {
            const wrappedNative = account ? getWrappedNativeToken(account.symbol) : undefined;

            if (!account || !wrappedNative) {
                return { type: 'error' };
            }

            try {
                // There is no background fee-info sync on mobile (desktop has one), so fresh
                // levels must be fetched before composing — the compose thunk reads them from
                // the store and errors with `missing-fee-level` when the network has none yet.
                await dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol })).unwrap();

                const composePayload = {
                    account,
                    token: {
                        contractAddress: wrappedNative.address,
                        decimals: wrappedNative.decimals,
                    },
                };
                const result = await dispatch(
                    flowType === 'wrap'
                        ? composeYieldWrapTransactionThunk({
                              ...composePayload,
                              wrapAmount: composeAmount,
                          })
                        : composeYieldUnwrapTransactionThunk({
                              ...composePayload,
                              unwrapAmount: composeAmount,
                          }),
                ).unwrap();

                if (result.type !== 'action-ready') {
                    return { type: 'error' };
                }

                const spentToken =
                    flowType === 'wrap'
                        ? {
                              contractAddress: null,
                              decimals: getNetwork(account.symbol).decimals,
                              symbol: getNetworkDisplaySymbol(account.symbol),
                          }
                        : {
                              contractAddress: wrappedNative.address,
                              decimals: wrappedNative.decimals,
                              symbol: wrappedNative.symbol,
                          };

                return {
                    type: 'ready',
                    transaction: {
                        symbol: account.symbol,
                        token: spentToken,
                        unsignedTransaction: result.unsignedTransaction,
                    },
                };
            } catch {
                return { type: 'error' };
            }
        },
        [account, dispatch, flowType],
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
        (): PreparedWrappedNativeTokenAction | null =>
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
        isFeePreparing: fees.isFeePreparing,
        isFeeReady: fees.isFeeReady,
        preparedAction,
        retryFeeEstimation: fees.retryFeeEstimation,
        selectedFee: fees.selectedFee,
        updateFeeLevelThunk: updateEarnSelectedFeeLevelThunk,
    };
};
