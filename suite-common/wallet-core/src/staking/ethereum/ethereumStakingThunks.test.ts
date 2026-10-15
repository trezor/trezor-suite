import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { type TrezorDevice } from '@suite-common/suite-types';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    AddressDisplayOptions,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
    type StakeFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { stakeActions } from '../stakingActions';
import { buildClaimWithdrawRequestData, buildStakeData, buildUnstakeData } from './ethereumStaking';
import { UNSTAKE_INTERCHANGES } from './ethereumStakingConstants';
import {
    type PreparedEthereumStakingContext,
    prepareEthereumStakingContext,
} from './ethereumStakingSignUtils';
import { signPreparedEthereumStakingTransactionThunk } from './ethereumStakingThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        ethereumSignTransaction: jest.fn(),
        getAccountInfo: jest.fn(),
    },
}));

const ETH = asNetworkSymbol('eth');
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
const ACCOUNTING_ADDRESS = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';

const ethAccount = mockWalletAccount(
    {
        symbol: ETH,
        descriptor: asAccountDescriptor('0xfffffffffffffffffffffffffffffffffffffffe'),
        path: "m/44'/60'/0'/0/0",
    },
    { misc: { nonce: '7' } },
);

const selectedDevice = {
    path: 'device-id:1',
    instance: 1,
    state: { sessionId: '1', staticSessionId: ethAccount.deviceState },
    useEmptyPassphrase: true,
} as unknown as TrezorDevice;

const VALID_LIVE_STAKING_POOL = {
    success: true,
    payload: {
        misc: {
            stakingPools: [
                {
                    autocompoundBalance: '2000000000000000000',
                    withdrawTotalAmount: '100000000000000000',
                    claimableAmount: '100000000000000000',
                },
            ],
        },
    },
};

type State = {
    device: { selectedDevice: TrezorDevice | undefined };
    wallet: {
        accounts: Account[];
        transactions: {
            transactions: Record<never, never>;
            phishing: Record<never, never>;
            fetchStatusDetail: Record<never, never>;
        };
        settings: { addressDisplayType: AddressDisplayOptions };
    };
};

type BuildStoreParams = {
    addressDisplayType?: AddressDisplayOptions;
    hasSelectedDevice?: boolean;
};

const buildStore = ({
    addressDisplayType = AddressDisplayOptions.ORIGINAL,
    hasSelectedDevice = true,
}: BuildStoreParams = {}) =>
    createTestCompositionRoot<void, State>({
        reducer: combineReducers({
            device: () => ({ selectedDevice: hasSelectedDevice ? selectedDevice : undefined }),
            wallet: combineReducers({
                accounts: () => [ethAccount],
                transactions: () => ({ transactions: {}, phishing: {}, fetchStatusDetail: {} }),
                settings: () => ({ addressDisplayType }),
            }),
        }),
    }).services.store;

const buildCalldata = (stakeType: BaseStakeType) => {
    if (stakeType === 'stake') return buildStakeData();
    if (stakeType === 'unstake') {
        return buildUnstakeData('1500000000000000000', UNSTAKE_INTERCHANGES);
    }

    return buildClaimWithdrawRequestData();
};

const buildFormValues = (stakeType: BaseStakeType): StakeFormState => ({
    outputs: [
        {
            address: stakeType === 'claim' ? ACCOUNTING_ADDRESS : POOL_ADDRESS,
            amount: stakeType === 'stake' ? '1.5' : '0',
            type: 'payment',
            token: null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    options: [],
    transactionData: buildCalldata(stakeType),
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
    stakeType,
});

const precomposedTransaction = {
    type: 'final',
    feeLimit: '52000',
    feePerByte: '20',
    fee: '1040000',
    totalSpent: '0',
    outputs: [],
    bytes: 0,
    inputs: [],
    outputsPermutation: [0],
} as PrecomposedTransactionFinal;

const buildContext = (stakeType: BaseStakeType): PreparedEthereumStakingContext => {
    const prepared = prepareEthereumStakingContext(
        { wallet: { accounts: [ethAccount] } },
        {
            accountKey: ethAccount.key,
            stakeType,
            precomposedTransaction,
            formValues: buildFormValues(stakeType),
        },
    );
    if (!prepared.ok) throw new Error('prepare failed');

    return prepared.context;
};

const ethereumSignTransactionMock = TrezorConnect.ethereumSignTransaction as jest.Mock;
const getAccountInfoMock = TrezorConnect.getAccountInfo as jest.Mock;

const sign = async (store: TestCompositionStore<State, void>, stakeType: BaseStakeType) => {
    const action = await store.dispatch(
        signPreparedEthereumStakingTransactionThunk({ context: buildContext(stakeType) }) as any,
    );

    if (isFulfilled(action)) return { ok: true as const, payload: action.payload };
    if (isRejected(action)) return { ok: false as const, error: action.payload };

    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    ethereumSignTransactionMock.mockResolvedValue({
        success: true,
        payload: { serializedTx: '0xsignedtx' },
    });
    getAccountInfoMock.mockResolvedValue(VALID_LIVE_STAKING_POOL);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('signPreparedEthereumStakingTransactionThunk', () => {
    it('signs the prepared stake with the resolved nonce on the selected device', async () => {
        const store = buildStore();

        const result = await sign(store, 'stake');

        expect(result).toEqual({ ok: true, payload: { serializedTx: '0xsignedtx' } });
        expect(ethereumSignTransactionMock).toHaveBeenCalledWith({
            device: {
                path: 'device-id:1',
                instance: 1,
                state: selectedDevice.state,
                useEmptyPassphrase: true,
            },
            path: ethAccount.path,
            transaction: {
                to: POOL_ADDRESS,
                value: '0x14d1120d7b160000',
                chainId: 1,
                nonce: '0x7',
                gasLimit: '0xcb20',
                data: buildStakeData(),
                gasPrice: '0x4a817c800',
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
            },
            chunkify: false,
        });
        expect(store.getActions()).toContainEqual(stakeActions.setResolvedEthereumNonce('7'));
    });

    it('asks the device for chunked addresses when the wallet setting says so', async () => {
        const store = buildStore({ addressDisplayType: AddressDisplayOptions.CHUNKED });

        await sign(store, 'stake');

        expect(ethereumSignTransactionMock.mock.calls[0][0].chunkify).toBe(true);
    });

    it('signs without a device selection when none is selected', async () => {
        const store = buildStore({ hasSelectedDevice: false });

        const result = await sign(store, 'stake');

        expect(result.ok).toBe(true);
        expect(ethereumSignTransactionMock.mock.calls[0][0].device).toBeUndefined();
    });

    it('reads the chain only for the nonce before a stake', async () => {
        const store = buildStore();

        await sign(store, 'stake');

        expect(getAccountInfoMock).toHaveBeenCalledTimes(1);
    });

    it('reads the chain for the live state and the nonce before an unstake', async () => {
        const store = buildStore();

        await sign(store, 'unstake');

        expect(getAccountInfoMock).toHaveBeenCalledTimes(2);
    });

    it('signs an unstake and a claim once the chain state allows them', async () => {
        const store = buildStore();

        expect(await sign(store, 'unstake')).toMatchObject({ ok: true });
        expect(await sign(store, 'claim')).toMatchObject({ ok: true });
        expect(ethereumSignTransactionMock).toHaveBeenCalledTimes(2);
        expect(ethereumSignTransactionMock.mock.calls[1][0].transaction.to).toBe(
            ACCOUNTING_ADDRESS,
        );
    });

    it('rejects an unstake when the staked balance dropped below the requested amount', async () => {
        getAccountInfoMock.mockResolvedValue({
            success: true,
            payload: { misc: { stakingPools: [{ autocompoundBalance: '1000000000000000000' }] } },
        });
        const store = buildStore();

        const result = await sign(store, 'unstake');

        expect(result).toEqual({
            ok: false,
            error: { error: 'stake-live-state-invalid', message: 'Max Amount For Unstake 1' },
        });
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
    });

    it('rejects a claim when the withdraw request is not fully filled yet', async () => {
        getAccountInfoMock.mockResolvedValue({
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        { withdrawTotalAmount: '200000000000000000', claimableAmount: '1' },
                    ],
                },
            },
        });
        const store = buildStore();

        const result = await sign(store, 'claim');

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'stake-live-state-invalid',
                message: 'Unstake request not filled yet',
            },
        });
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
    });

    it('passes the device cancellation through', async () => {
        ethereumSignTransactionMock.mockResolvedValue({
            success: false,
            error: { code: 'Method_Cancel', message: 'tx-cancelled' },
        });
        const store = buildStore();

        expect(await sign(store, 'stake')).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                errorCode: 'Method_Cancel',
                message: 'tx-cancelled',
            },
        });
    });

    it('reports a validity timeout as its own rejection', async () => {
        ethereumSignTransactionMock.mockResolvedValue({
            success: false,
            error: { code: 'Method_Cancel', message: 'tx-timeout' },
        });
        const store = buildStore();

        expect(await sign(store, 'stake')).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-timeout',
                errorCode: 'Method_Cancel',
                message: 'tx-timeout',
            },
        });
    });
});
