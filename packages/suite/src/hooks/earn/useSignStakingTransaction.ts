import { useCallback } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import {
    type SignTransactionThunkParams,
    signTransactionThunk,
} from '#src/actions/wallet/stakeActions';

import { useStakingDeviceAction } from './useStakingDeviceAction';

type SignStakingTransactionParams = Pick<SignTransactionThunkParams, 'formValues'> & {
    transactionInfo?: SignTransactionThunkParams['transactionInfo'];
    refreshComposition?: () => void | Promise<void>;
    beforeDeviceCheck?: () => Promise<void>;
    beforeSigning?: () => void;
    onSuccess?: () => void | Promise<void>;
};

export const useSignStakingTransaction = (account: Account | undefined) => {
    const { dispatch } = useServices(injectDispatch);
    const runWithDevice = useStakingDeviceAction(account);

    return useCallback(
        async ({
            formValues,
            transactionInfo,
            refreshComposition,
            beforeDeviceCheck,
            beforeSigning,
            onSuccess,
        }: SignStakingTransactionParams) => {
            if (!account) return;

            await runWithDevice(async device => {
                // A reconnected wallet may supply a previously missing fee. Let the user
                // review the newly composed transaction before starting a signature.
                if (!transactionInfo) {
                    await refreshComposition?.();

                    return;
                }
                beforeSigning?.();
                const result = await dispatch(
                    signTransactionThunk({
                        accountKey: account.key,
                        device,
                        formValues,
                        transactionInfo,
                    }),
                );
                if (result?.success) await onSuccess?.();
            }, beforeDeviceCheck);
        },
        [account, dispatch, runWithDevice],
    );
};
