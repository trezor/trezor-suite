import { configureMockStore } from '@suite-common/test-utils';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { ACCOUNT_AUTHORIZATION_UNAVAILABLE_MESSAGE } from '@suite-common/wallet-utils';

import { signTransactionThunk } from '../send/sendFormThunks';
import { deactivateStellarTokenThunk } from '../token/stellarTokenThunks';

const watchOnlyAccount = { isWatchOnly: true } as Account;

const authorizationContracts = [
    [
        'send transaction',
        signTransactionThunk({
            formState: {} as FormState,
            precomposedTransaction: { type: 'final' } as PrecomposedTransactionFinal,
            selectedAccount: watchOnlyAccount,
        }),
    ],
    [
        'Stellar token deactivation',
        deactivateStellarTokenThunk({
            account: watchOnlyAccount,
            contractAddress: 'USDC-GISSUER',
            selectedFee: 'normal',
        }),
    ],
] as const;

it.each(authorizationContracts)(
    '%s rejects watch-only accounts before device authorization',
    async (_, authorize) => {
        const result = await configureMockStore().dispatch(authorize);

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toEqual({
            error: 'sign-transaction-failed',
            message: ACCOUNT_AUTHORIZATION_UNAVAILABLE_MESSAGE,
        });
    },
);
