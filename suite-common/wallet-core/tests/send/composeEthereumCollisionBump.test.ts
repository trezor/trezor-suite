import { configureMockStore } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type FormState, type RbfTransactionParams } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { evmTx, feeInfoEip1559 } from './evmFixtures';
import { composeEthereumTransactionFeeLevelsThunk } from '../../src/send/sendFormEthereumThunks';

const account = mockWalletAccount({
    symbol: 'eth',
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
    balance: '1000000000000000000',
}) as any;

const composeContext = { account, network: getNetwork('eth'), feeInfo: feeInfoEip1559 } as any;

const formState = (overrides?: Partial<FormState>): FormState =>
    ({
        outputs: [
            { type: 'payment', address: '0xdcaB74E62b9D08a9f8Fa4A3Ccb5c46AE039C9d7C', amount: '0.001' },
        ],
        selectedFee: 'normal',
        options: ['broadcast'],
        ...overrides,
    }) as unknown as FormState;

// Pending tx occupying nonce 5, gas in Wei (50 / 5 Gwei).
const pendingAtNonce5 = evmTx(5, {
    confirmed: false,
    gas: { maxFeePerGas: '50000000000', maxPriorityFeePerGas: '5000000000' },
});

const initStore = (txs: ReturnType<typeof evmTx>[]) =>
    configureMockStore({
        preloadedState: {
            device: { selectedDevice: undefined },
            wallet: { transactions: { transactions: { [account.key]: txs } } },
        },
    });

const compose = (store: ReturnType<typeof initStore>, form: FormState) =>
    store
        .dispatch(composeEthereumTransactionFeeLevelsThunk({ formState: form, composeContext }))
        .unwrap();

describe('composeEthereumTransactionFeeLevelsThunk – pending-nonce collision bump', () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'blockchainEstimateFee').mockResolvedValue({
            success: true,
            payload: { levels: [{ feeLimit: '21000', feePerUnit: '20' }] },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('bumps the fee when the custom nonce replaces a pending tx', async () => {
        // getEthereumRbfFeeInfo(feeInfoEip1559, {maxFeePerGas:50, maxPriorityFeePerGas:5}) -> max(50,30)*1.2 = 60
        const levels = await compose(initStore([pendingAtNonce5]), formState({ ethereumNonce: '5' }));

        expect(levels.normal?.type).toBe('final');
        expect(levels.normal?.maxFeePerGas).toBe('60');
    });

    it('does not bump when the custom nonce does not collide with a pending tx', async () => {
        const levels = await compose(initStore([pendingAtNonce5]), formState({ ethereumNonce: '9' }));

        expect(levels.normal?.maxFeePerGas).toBe('20');
    });

    it('does not bump for an RBF flow (caller already pre-bumped the fee)', async () => {
        const levels = await compose(
            initStore([pendingAtNonce5]),
            formState({
                ethereumNonce: '5',
                rbfParams: { type: 'ethereum', ethereumNonce: 5 } as unknown as RbfTransactionParams,
            }),
        );

        expect(levels.normal?.maxFeePerGas).toBe('20');
    });
});
