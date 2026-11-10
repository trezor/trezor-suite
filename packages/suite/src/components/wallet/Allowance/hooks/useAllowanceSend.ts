import { useCallback } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { useCurrentRef } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { signAndPushSendFormTransactionThunk } from '#src/actions/wallet/send/sendFormThunks';

type UseAllowanceSendParams = {
    account: Account;
    methods: UseFormReturn<FormState>;
    shouldShowApprovalToast?: boolean;
};

type SendParams = {
    composedTransaction: PrecomposedTransactionFinal;
};

export const useAllowanceSend = ({
    account,
    methods,
    shouldShowApprovalToast,
}: UseAllowanceSendParams) => {
    const { dispatch } = useServices(injectDispatch);
    const methodsRef = useCurrentRef(methods);
    const accountRef = useCurrentRef(account);

    const send = useCallback(
        async ({ composedTransaction }: SendParams): Promise<{ txid: string } | null> => {
            const formState: FormState = methodsRef.current.getValues();

            const result = await dispatch(
                signAndPushSendFormTransactionThunk({
                    formState,
                    precomposedTransaction: composedTransaction,
                    selectedAccount: accountRef.current,
                    shouldShowApprovalToast,
                }),
            ).unwrap();

            if (!result) {
                return null;
            }

            const { payload } = result;

            if ('txid' in payload) {
                return { txid: payload.txid };
            }

            if ('error' in payload) {
                throw new Error(payload.error);
            }

            return null;
        },
        [dispatch, methodsRef, accountRef, shouldShowApprovalToast],
    );

    return { send };
};
