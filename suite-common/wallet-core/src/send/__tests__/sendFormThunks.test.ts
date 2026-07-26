import { configureMockStore } from '@suite-common/test-utils';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import { signTransactionThunk } from '../sendFormThunks';

describe(signTransactionThunk.name, () => {
    it('rejects a watch-only account before requesting device authorization', async () => {
        const store = configureMockStore();
        const selectedAccount = {
            accountType: 'imported',
            imported: true,
            isWatchOnly: true,
        } as Account;

        const result = await store.dispatch(
            signTransactionThunk({
                formState: {} as FormState,
                precomposedTransaction: {
                    type: 'final',
                } as PrecomposedTransactionFinal,
                selectedAccount,
            }),
        );

        expect(result).toMatchObject({
            meta: { requestStatus: 'rejected' },
            payload: {
                error: 'sign-transaction-failed',
                message: 'Watch-only accounts cannot authorize transactions.',
            },
        });
    });
});
