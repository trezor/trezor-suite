import { useEffect } from 'react';

import { isRejected } from '@reduxjs/toolkit';
import { useMutation } from '@tanstack/react-query';

import {
    type ComposeFeeLevelsError,
    type ComposedEthereumCancelTransaction,
    composeEthereumCancelTransactionThunk,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import {
    type Account,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';

interface UseEthereumCancelTxComposeParams {
    account: Account;
    tx: WalletAccountTransactionWithRequiredRbfParams;
}

const isComposeFeeLevelsError = (error: unknown): error is ComposeFeeLevelsError =>
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    error.error === 'fee-levels-compose-failed';

const parseError = (mutationError: unknown): string | null => {
    if (mutationError == null) {
        return null;
    }
    if (mutationError instanceof Error) {
        return mutationError.message;
    }
    if (isComposeFeeLevelsError(mutationError)) {
        return mutationError.message ?? mutationError.error;
    }

    return 'Unknown error';
};

export const useEthereumCancelTxCompose = ({ account, tx }: UseEthereumCancelTxComposeParams) => {
    const dispatch = useDispatch();
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));

    const {
        mutate,
        data,
        error: mutationError,
        isPending: isComposing,
    } = useMutation({
        mutationFn: async (): Promise<ComposedEthereumCancelTransaction> => {
            if (account.networkType !== 'ethereum') {
                throw new Error('Ethereum cancellation is only available for EVM accounts');
            }

            const result = await dispatch(composeEthereumCancelTransactionThunk({ account, tx }));
            if (isRejected(result)) {
                throw result.payload ?? new Error('Unknown error');
            }

            return result.payload;
        },
    });

    useEffect(() => {
        if (account.networkType !== 'ethereum' || !feeInfo || tx.rbfParams?.type !== 'ethereum') {
            return;
        }
        mutate();
    }, [account, tx, feeInfo, mutate]);

    const error = parseError(mutationError);

    return {
        composedCancelTx: data?.composedCancelTx ?? null,
        cancelFormState: data?.cancelFormState ?? null,
        error,
        isComposing,
    };
};
