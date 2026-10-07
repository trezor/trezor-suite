import { useCallback } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { useCurrentRef } from '@trezor/react-utils';

import { useSignAndPushTransaction } from 'src/hooks/wallet/chainSend/useSignAndPushTransaction';

interface UseAllowanceSendParams {
    account: Account;
    methods: UseFormReturn<FormState>;
}

interface SendParams {
    composedTransaction: PrecomposedTransactionFinal;
}

export const useAllowanceSend = ({ account, methods }: UseAllowanceSendParams) => {
    const signAndPushTransaction = useSignAndPushTransaction();
    const methodsRef = useCurrentRef(methods);
    const accountRef = useCurrentRef(account);

    const send = useCallback(
        async ({ composedTransaction }: SendParams): Promise<{ txid: string } | null> => {
            const formState: FormState = methodsRef.current.getValues();

            const result = await signAndPushTransaction({
                formState,
                precomposedTransaction: composedTransaction,
                selectedAccount: accountRef.current,
            });

            if (!result) {
                return null;
            }

            if (result.success) {
                return { txid: result.payload.txid };
            }

            throw new Error(result.error.message);
        },
        [signAndPushTransaction, methodsRef, accountRef],
    );

    return { send };
};
