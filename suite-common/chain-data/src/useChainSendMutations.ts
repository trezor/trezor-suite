import {
    CONFIDENTIAL_QUERY_META,
    chainMutationKeys,
    chainQueryKeys,
    useMutation,
    useQueryClient,
} from '@suite-common/react-query';
import type {
    ChainNetwork,
    ChainSignedTransaction,
    GeneralPrecomposedTransactionFinal,
    PushChainTransactionParams,
    SignChainTransactionParams,
} from '@trezor/network-module-suite-common-types';

import { addChainPendingSend } from './chainPendingSends';

export type SignChainTransactionVariables = SignChainTransactionParams & {
    network: ChainNetwork;
};

/**
 * Signs on the device. Never retried: the user confirms every attempt on the device, and a
 * cancelled or timed-out signing is the user's answer.
 */
export const useChainSignTransaction = () =>
    useMutation({
        mutationKey: chainMutationKeys.sign,
        mutationFn: ({ network, ...params }: SignChainTransactionVariables) => {
            if (!network.send) throw new Error(`Network ${network.symbol} cannot send.`);

            return network.send.sign(params);
        },
        retry: false,
        meta: CONFIDENTIAL_QUERY_META,
    });

export type PushChainTransactionVariables = PushChainTransactionParams & {
    network: ChainNetwork;
    precomposed: GeneralPrecomposedTransactionFinal;
    signed: ChainSignedTransaction;

    /** The transaction this one replaces (RBF), which the history then hides. */
    replacedTxid?: string;
};

/**
 * Broadcasts a signed transaction. Never retried: a repeated broadcast of a transaction that did
 * reach the network fails, and the user decides whether to try again.
 *
 * The broadcast transaction shows in the account's history right away, and everything read for the
 * account is read again.
 */
export const useChainPushTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: chainMutationKeys.push,
        mutationFn: ({
            network,
            account,
            serializedTx,
            isMevProtectionEnabled,
        }: PushChainTransactionVariables) => {
            if (!network.send) throw new Error(`Network ${network.symbol} cannot send.`);

            return network.send.push({ account, serializedTx, isMevProtectionEnabled });
        },
        onSuccess: ({ txid }, { network, account, precomposed, signed, replacedTxid }) => {
            if (!network.send) return;

            addChainPendingSend(queryClient, {
                network,
                descriptor: account.descriptor,
                pendingSend: {
                    transaction: network.send.createPendingTransaction({
                        account,
                        precomposed,
                        signed,
                        txid,
                    }),
                    replacedTxid,
                    sentAt: Date.now(),
                },
            });

            return queryClient.invalidateQueries({
                queryKey: chainQueryKeys.account(
                    network.symbol,
                    network.backendType,
                    account.descriptor,
                ),
            });
        },
        retry: false,
        meta: CONFIDENTIAL_QUERY_META,
    });
};
