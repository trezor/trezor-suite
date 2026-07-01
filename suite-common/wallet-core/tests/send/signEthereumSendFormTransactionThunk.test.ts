import { configureMockStore } from '@suite-common/test-utils';
import {
    AddressDisplayOptions,
    type FormState,
    type RbfTransactionParams,
} from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { confirmedNonces, ethAccount, evmTx } from './evmFixtures';
import { signEthereumSendFormTransactionThunk } from '../../src/send/sendFormEthereumThunks';

const precomposedTransaction = {
    type: 'final',
    feeLimit: '21000',
    maxFeePerGas: '20',
    maxPriorityFeePerGas: '2',
    feePerByte: '20',
    token: undefined,
} as any;

const device = { path: '1', instance: 0, state: 'state@x:0', useEmptyPassphrase: true } as any;

const ethereumRbf = (ethereumNonce: number) =>
    ({ type: 'ethereum', ethereumNonce }) as unknown as RbfTransactionParams;

const formState = (overrides?: Partial<FormState>): FormState =>
    ({
        outputs: [{ type: 'payment', address: '0xabc', amount: '0' }],
        selectedFee: 'normal',
        options: ['broadcast'],
        ...overrides,
    }) as unknown as FormState;

const initStore = (txs = confirmedNonces(6)) =>
    configureMockStore({
        preloadedState: {
            wallet: {
                transactions: { transactions: { [ethAccount.key]: txs } },
                settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL },
            },
        },
    });

const sign = (store: ReturnType<typeof initStore>, form: FormState) =>
    store
        .dispatch(
            signEthereumSendFormTransactionThunk({
                formState: form,
                precomposedTransaction,
                selectedAccount: ethAccount,
                device,
            }),
        )
        .unwrap();

describe(signEthereumSendFormTransactionThunk.name, () => {
    let signMock: jest.SpyInstance;

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '6' } },
        } as any);
        signMock = jest.spyOn(TrezorConnect, 'ethereumSignTransaction').mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsigned' },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('rejects a custom nonce below the confirmed nonce', async () => {
        // confirmed 0..5 -> confirmed nonce 6, next 6
        await expect(sign(initStore(), formState({ ethereumNonce: '3' }))).rejects.toMatchObject({
            error: 'sign-transaction-failed',
            message: expect.stringContaining('below the confirmed nonce'),
        });
        expect(signMock).not.toHaveBeenCalled();
    });

    it('signs a custom nonce above the next expected one (gap allowed)', async () => {
        // confirmed 0..5 -> next 6; nonce 9 leaves a gap, which is now permitted (warned in the UI).
        await sign(initStore(), formState({ ethereumNonce: '9' }));

        expect(signMock).toHaveBeenCalledTimes(1);
        expect(signMock.mock.calls[0][0].transaction.nonce).toBe('0x9');
    });

    it('signs with a valid custom nonce', async () => {
        await sign(initStore(), formState({ ethereumNonce: '6' }));

        expect(signMock).toHaveBeenCalledTimes(1);
        expect(signMock.mock.calls[0][0].transaction.nonce).toBe('0x6');
    });

    it('uses the RBF nonce when rbfParams are set', async () => {
        const store = initStore([...confirmedNonces(6), evmTx(13, { confirmed: false })]);

        await sign(store, formState({ rbfParams: ethereumRbf(13) }));

        expect(signMock.mock.calls[0][0].transaction.nonce).toBe('0xd'); // 13
    });
});
