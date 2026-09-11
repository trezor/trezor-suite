import { createTestStore } from '@suite-common/test-utils';
import {
    type Account,
    AddressDisplayOptions,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { signSolanaSendFormTransactionThunk } from './sendFormSolanaThunks';

const tokenAccountInfo = {
    baseAddress: 'recipient',
    tokenAccount: 'recipient-token-account',
    tokenMint: 'token-mint',
    tokenProgram: 'token-program',
};
const account = {
    descriptor: 'account',
    networkType: 'solana',
    path: "m/44'/501'/0'/0'",
    symbol: 'sol',
} as unknown as Account;
const device = {
    instance: 0,
    path: 'device-path',
    state: 'device-state',
    useEmptyPassphrase: true,
};
const formState = {
    destinationTag: undefined,
    outputs: [{ address: 'recipient', amount: '1', type: 'payment' }],
    transactionData: 'serialized-transaction',
} as FormState;
const precomposedTransaction = {
    feeLimit: '200000',
    feePerByte: '300000',
    solanaTokenAccountInfos: [tokenAccountInfo],
    type: 'final',
} as PrecomposedTransactionFinal;

describe(signSolanaSendFormTransactionThunk.name, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('passes backend-resolved token-account mappings to the device', async () => {
        jest.spyOn(TrezorConnect, 'blockchainGetInfo').mockResolvedValue({
            success: true,
            payload: { blockHash: 'block-hash', blockHeight: 1 },
        } as any);
        jest.spyOn(TrezorConnect, 'solanaComposeTransaction').mockResolvedValue({
            success: true,
            payload: {
                additionalInfo: {},
                serializedTx: 'serialized-transaction',
            },
        } as any);
        const signTransaction = jest
            .spyOn(TrezorConnect, 'solanaSignTransaction')
            .mockResolvedValue({
                success: true,
                payload: { serializedTx: 'signed-transaction' },
            } as any);
        const store = createTestStore({
            extra: undefined,
            preloadedState: {
                wallet: {
                    settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL },
                },
            },
        });

        await store
            .dispatch(
                signSolanaSendFormTransactionThunk({
                    device: device as any,
                    formState,
                    precomposedTransaction,
                    selectedAccount: account,
                }),
            )
            .unwrap();

        expect(signTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                additionalInfo: {
                    tokenAccountsInfos: [tokenAccountInfo],
                },
            }),
        );
    });
});
