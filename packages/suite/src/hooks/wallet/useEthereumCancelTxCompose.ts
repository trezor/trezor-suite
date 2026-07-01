import { useEffect } from 'react';

import { useMutation } from '@tanstack/react-query';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeFeeLevelsError,
    composeSendFormTransactionFeeLevelsThunk,
    getEthereumRbfFeeInfo,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinalCancelRbf,
    type RbfTransactionParamsEthereum,
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
        mutationFn: async (): Promise<{
            composedCancelTx: PrecomposedTransactionFinalCancelRbf;
            cancelFormState: FormState;
        }> => {
            if (!feeInfo || tx.rbfParams?.type !== 'ethereum') {
                throw new Error('Missing fee info or invalid RBF params for Ethereum cancellation');
            }

            const rbfParams = tx.rbfParams as RbfTransactionParamsEthereum;
            const network = getNetwork(account.symbol);

            const formState: FormState = {
                outputs: [
                    {
                        type: 'payment',
                        address: account.descriptor,
                        amount: '0',
                        fiat: '',
                        currency: { value: '', label: '' },
                        token: null,
                    },
                ],
                selectedFee: 'normal',
                feePerUnit: '',
                feeLimit: '',
                options: ['broadcast'],
                isCoinControlEnabled: false,
                hasCoinControlBeenOpened: false,
                selectedUtxos: [],
                rbfParams,
            };

            const feeLevels = await dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState,
                    composeContext: {
                        account,
                        network,
                        feeInfo: getEthereumRbfFeeInfo(feeInfo, rbfParams),
                    },
                }),
            ).unwrap();

            const normalLevel = feeLevels.normal;
            if (!normalLevel || normalLevel.type === 'error' || normalLevel.type === 'nonfinal') {
                throw new Error('Unable to compose a valid cancellation fee level.');
            }

            return {
                composedCancelTx: {
                    ...normalLevel,
                    rbfType: 'cancel',
                    prevTxid: tx.txid,
                } as PrecomposedTransactionFinalCancelRbf,
                cancelFormState: formState,
            };
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
