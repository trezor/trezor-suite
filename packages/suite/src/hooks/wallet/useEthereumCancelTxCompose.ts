import { isRejected } from '@reduxjs/toolkit';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { useDispatch } from '@suite-common/redux-utils';
import {
    composeEthereumCancelTransactionThunk,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import {
    type Account,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

interface UseEthereumCancelTxComposeParams {
    account: Account;
    tx: WalletAccountTransactionWithRequiredRbfParams;
}

export const useEthereumCancelTxCompose = ({ account, tx }: UseEthereumCancelTxComposeParams) => {
    const dispatch = useDispatch();
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));
    const ethereumAccount = account.networkType === 'ethereum' ? account : undefined;

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is account.key + txid; feeInfo deliberately stays out of the key, recomposition is driven by refetches
    const { data, error, isLoading } = useQuery({
        queryKey: desktopQueryKeys.composeEvmCancelTx(account.key, tx.txid),
        queryFn: async () => {
            // Unreachable while disabled — `enabled` below is false for non-ethereum accounts.
            if (!ethereumAccount) throw new Error('Not an ethereum account');

            const result = await dispatch(
                composeEthereumCancelTransactionThunk({ account: ethereumAccount, tx }),
            );
            if (isRejected(result)) {
                throw new Error(
                    result.payload?.message ?? result.payload?.error ?? 'Unknown error',
                );
            }

            return result.payload;
        },
        enabled: !!ethereumAccount && !!feeInfo && tx.rbfParams?.type === 'ethereum',
        // A composed cancel tx is signed right away — never reuse one cached from a previous
        // modal open.
        gcTime: 0,
    });

    return {
        composedCancelTx: data?.composedCancelTx ?? null,
        cancelFormState: data?.cancelFormState ?? null,
        error: error?.message ?? null,
        isComposing: isLoading,
    };
};
