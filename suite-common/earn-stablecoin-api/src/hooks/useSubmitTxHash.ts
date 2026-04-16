import { type MutationOptions, desktopMutationKeys, useMutation } from '@suite-common/react-query';

import {
    type SubmitTransactionHashResponseError,
    type SubmitTransactionHashResponseSuccess,
    submitTransactionHash,
} from '../api';

type SubmitTxHashVariables = {
    txId: string;
    txHash: string;
};

interface UseSubmitTxHashProps {
    onSuccess?: MutationOptions<
        SubmitTransactionHashResponseSuccess,
        Error,
        SubmitTxHashVariables
    >['onSuccess'];
    onError?: MutationOptions<
        SubmitTransactionHashResponseError,
        Error,
        SubmitTxHashVariables
    >['onError'];
}

/**
 * Submit the transaction hash after broadcasting a transaction to the blockchain. This updates the transaction status and enables tracking.
 * @url https://docs.yield.xyz/reference/transactionscontroller_submittransactionhash
 */
export function useSubmitTxHash({ onSuccess, onError }: UseSubmitTxHashProps) {
    return useMutation<SubmitTransactionHashResponseSuccess, Error, SubmitTxHashVariables>({
        mutationKey: desktopMutationKeys.submitTxHash,
        mutationFn: ({ txId, txHash }) =>
            submitTransactionHash({ transactionId: txId }, { hash: txHash }),
        onSuccess,
        onError,
    });
}
