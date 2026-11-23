import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { getStakeFormsDefaultValues, initialWalletSettingsState } from '@suite-common/wallet-core';
import {
    type ComposeActionContext,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
    type StakeFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type EthereumTransaction } from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { composeTransaction, signTransactionThunk } from './stakeFormEthereumActions';

const mockGetStakeTxGasLimit = jest.fn();
const mockPrepareStakeEthTx = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    getStakeTxGasLimit: (params: unknown) => mockGetStakeTxGasLimit(params),
    prepareStakeEthTx: (params: unknown) => mockPrepareStakeEthTx(params),
}));

jest.mock('@suite-common/wallet-core/src/send/sendFormEthereumThunks', () => ({
    ...jest.requireActual('@suite-common/wallet-core/src/send/sendFormEthereumThunks'),
    ethereumGetCurrentNonceThunk: () => ({
        type: 'mock/ethereumGetCurrentNonce',
        unwrap: () => Promise.resolve({ nonce: '7', confirmedNonce: '7' }),
    }),
}));

jest.mock('@trezor/connect', () => {
    const actual = jest.requireActual('@trezor/connect');

    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            ethereumSignTransaction: jest.fn(),
        },
    };
});

const ethereumSignTransactionMock = TrezorConnect.ethereumSignTransaction as jest.Mock;

type SignTransactionThunkState = ReturnType<Parameters<ReturnType<typeof signTransactionThunk>>[1]>;

const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
// 1 ETH available; 300 000 gas at 20 gwei = 0.006 ETH fee
const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0x00000000000000000000000000000000000000aa'),
    balance: '1000000000000000000',
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
});

const compose = ({ amount, isMax }: { amount: string; isMax: boolean }) => {
    const defaults = getStakeFormsDefaultValues({
        address: POOL_ADDRESS,
        stakeType: 'stake',
        amount,
    });
    const formValues = {
        ...defaults,
        selectedFee: 'normal',
        setMaxOutputId: isMax ? 0 : undefined,
    } as StakeFormState;
    const formState: ComposeActionContext = {
        account,
        network: getNetwork('eth'),
        feeInfo: {
            blockHeight: 1,
            blockTime: 12,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 0,
            levels: [{ label: 'normal', feePerUnit: '20', feeLimit: '21000', blocks: -1 }],
        },
    };

    return composeTransaction(formValues, formState)() as Promise<PrecomposedLevels | undefined>;
};

describe('ethereum composeTransaction', () => {
    beforeEach(() => {
        mockGetStakeTxGasLimit.mockResolvedValue({ success: true, gasLimit: '300000' });
    });

    it('stakes the balance minus the composed fee and the withdrawal reserve on Max', async () => {
        const levels = await compose({ amount: '0.995', isMax: true });

        expect(levels?.normal).toMatchObject({ type: 'final', max: '0.989' });
    });

    it('stakes a typed amount as it is', async () => {
        const levels = await compose({ amount: '0.5', isMax: false });

        expect(levels?.normal).toMatchObject({ type: 'final', max: undefined });
        expect(levels?.normal?.type === 'final' && levels.normal.outputs[0]).toMatchObject({
            amount: '500000000000000000',
        });
    });
});

describe('ethereum signTransactionThunk', () => {
    const preparedTransaction: EthereumTransaction = {
        to: POOL_ADDRESS,
        value: '0xde0b6b3a7640000',
        data: '0x3a29dbae',
        gasLimit: '0x493e0',
        gasPrice: '0x4a817c800',
        nonce: '0x7',
        chainId: 1,
    };

    beforeEach(() => {
        mockPrepareStakeEthTx.mockResolvedValue({ success: true, tx: preparedTransaction });
        ethereumSignTransactionMock.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'signed-eth-tx' },
        });
    });

    it('returns the signed transaction together with what was handed to the device', async () => {
        const getState = () =>
            ({
                device: { ...deviceInitialState, selectedDevice: mockSuiteDevice() },
                wallet: { settings: initialWalletSettingsState },
            }) as unknown as SignTransactionThunkState;
        const extra = { services: { analytics: mockDesktopAnalytics() } };
        const { dispatch } = createMockDispatch({ getState, extra });

        const result = await signTransactionThunk({
            account,
            formValues: getStakeFormsDefaultValues({
                address: POOL_ADDRESS,
                stakeType: 'stake',
                amount: '1',
            }) as StakeFormState,
            transactionInfo: { type: 'final', feePerByte: '20' } as PrecomposedTransactionFinal,
        })(dispatch, getState, extra);

        expect(ethereumSignTransactionMock).toHaveBeenCalledWith(
            expect.objectContaining({ transaction: preparedTransaction }),
        );
        expect(result).toEqual({ serializedTx: 'signed-eth-tx', transaction: preparedTransaction });
    });
});
