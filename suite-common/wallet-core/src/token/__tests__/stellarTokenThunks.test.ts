import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { deactivateStellarTokenThunk } from '../stellarTokenThunks';

describe(deactivateStellarTokenThunk.name, () => {
    it('rejects a watch-only account before requesting device authorization', async () => {
        const store = configureMockStore();
        const account = mockWalletAccount({
            symbol: 'xlm',
            accountType: 'imported',
            imported: true,
            isWatchOnly: true,
        });

        const result = await store.dispatch(
            deactivateStellarTokenThunk({
                account,
                contractAddress: 'USDC-GISSUER',
                selectedFee: 'normal',
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
