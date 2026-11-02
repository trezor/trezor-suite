import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type SignTransactionThunkState, signTransactionThunk } from './sendFormThunks';

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => ({ path: 'test-device' }),
}));
jest.mock('./sendFormEthereumThunks', () => ({
    ...jest.requireActual('./sendFormEthereumThunks'),
    signEthereumSendFormTransactionThunk: () => () =>
        Promise.resolve({
            type: 'test/ethereum-sign/rejected',
            payload: {
                error: 'sign-transaction-failed',
                errorCode: 'Method_Cancel',
                message: 'tx-cancelled',
            },
            meta: { requestStatus: 'rejected', requestId: 'test-sign' },
        }),
}));

it('preserves a machine-readable cancellation code when translating the app cancellation marker', async () => {
    const { store } = createTestCompositionRoot<void, SignTransactionThunkState>({
        preloadedState: {},
    }).services;

    await expect(
        store
            .dispatch(
                signTransactionThunk({
                    selectedAccount: mockWalletAccount({
                        symbol: asNetworkSymbol('eth'),
                    }),
                    formState: {
                        outputs: [],
                        options: ['broadcast'],
                        feePerUnit: '1',
                        feeLimit: '21000',
                        isCoinControlEnabled: false,
                        hasCoinControlBeenOpened: false,
                        selectedUtxos: [],
                    },
                    precomposedTransaction: {
                        type: 'final',
                        inputs: [],
                        outputs: [],
                        fee: '0',
                        totalSpent: '0',
                        feePerByte: '1',
                        bytes: 1,
                        outputsPermutation: [],
                    },
                }),
            )
            .unwrap(),
    ).rejects.toMatchObject({
        error: 'sign-transaction-failed',
        errorCode: 'Method_Cancel',
    });
});
