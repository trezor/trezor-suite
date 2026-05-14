import { combineReducers, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import {
    buildClaimWithdrawRequestData,
    buildStakeData,
    buildUnstakeData,
} from '@suite-common/staking';
import { type TrezorDevice } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { UNSTAKE_INTERCHANGES } from '@suite-common/wallet-constants';
import { prepareSendFormReducer } from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { signEthereumStakingTransactionNativeThunk } from '../stakeFormEthereumNativeThunks';
import { type EthereumStakingType } from '../stakeFormEthereumNativeTypes';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        ethereumSignTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsignedtx' },
        }),
        pushTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        }),
    },
}));

jest.mock('@suite-native/device-mutex', () => ({
    requestPrioritizedDeviceAccess: async (callback: () => Promise<unknown>) => ({
        success: true,
        payload: await callback(),
    }),
}));

const STATIC_SESSION_ID = '1stTestnetAddress@device_id:0';
const ETH_ACCOUNT_KEY = 'eth1' as AccountKey;
const CARDANO_ACCOUNT_KEY = 'cardano1' as AccountKey;
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
const ACCOUNTING_ADDRESS = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';

const ethAccount: Account = {
    symbol: 'eth',
    networkType: 'ethereum',
    key: ETH_ACCOUNT_KEY,
    deviceState: STATIC_SESSION_ID,
    descriptor: '0xfffffffffffffffffffffffffffffffffffffffe',
    path: "m/44'/60'/0'/0/0",
    visible: true,
    misc: { nonce: '7' },
} as unknown as Account;

const cardanoAccount: Account = {
    symbol: 'ada',
    networkType: 'cardano',
    key: CARDANO_ACCOUNT_KEY,
    deviceState: STATIC_SESSION_ID,
    visible: true,
} as unknown as Account;

const buildPrecomposedTransaction = (
    overrides: Partial<PrecomposedTransactionFinal> = {},
): PrecomposedTransactionFinal =>
    ({
        type: 'final',
        feeLimit: '52000',
        feePerByte: '20',
        fee: '1040000',
        totalSpent: '0',
        outputs: [],
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
        ...overrides,
    }) as PrecomposedTransactionFinal;

const buildCalldataForKind = (kind: EthereumStakingType): string => {
    if (kind === 'stake') return buildStakeData();
    if (kind === 'unstake') return buildUnstakeData('1500000000000000000', UNSTAKE_INTERCHANGES);

    return buildClaimWithdrawRequestData();
};

const buildComposeFormDraft = (kind: EthereumStakingType, ethAmount: string): FormState =>
    ({
        outputs: [
            {
                address: kind === 'claim' ? ACCOUNTING_ADDRESS : POOL_ADDRESS,
                amount: kind === 'stake' ? ethAmount : '0',
                type: 'payment',
                token: null,
                fiat: '',
                currency: { label: '', value: '' },
            },
        ],
        options: ['transactionData'],
        transactionData: buildCalldataForKind(kind),
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
    }) as FormState;

const buildStore = ({
    accounts = [ethAccount],
    formDrafts = {},
}: {
    accounts?: Account[];
    formDrafts?: Record<string, FormState>;
} = {}) =>
    configureMockStore({
        reducer: combineReducers({
            device: () => ({
                selectedDevice: {
                    path: 'device-id:1',
                    instance: 1,
                    state: { sessionId: '1', staticSessionId: STATIC_SESSION_ID },
                    useEmptyPassphrase: true,
                } as unknown as TrezorDevice,
            }),
            messageSystem: () => messageSystemInitialState,
            wallet: combineReducers({
                accounts: () => accounts,
                transactions: () => ({
                    transactions: {},
                    phishing: {},
                    fetchStatusDetail: {},
                }),
                formDrafts: () => formDrafts,
                send: prepareSendFormReducer(extraDependenciesCommonMock),
                settings: () => ({ mevProtection: false }),
            }),
        }),
    });

const ethereumSignTransactionMock = TrezorConnect.ethereumSignTransaction as jest.Mock;
const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;

const dispatchFlow = async (
    store: ReturnType<typeof buildStore>,
    args: Parameters<typeof signEthereumStakingTransactionNativeThunk>[0],
) => {
    const action = await store.dispatch(signEthereumStakingTransactionNativeThunk(args) as any);

    if (isFulfilled(action)) return { ok: true as const, txid: action.payload.txid };
    if (isRejected(action)) return { ok: false as const, error: action.payload };

    throw new Error('Unexpected dispatch outcome');
};

beforeEach(() => {
    ethereumSignTransactionMock.mockClear();
    pushTransactionMock.mockClear();
    ethereumSignTransactionMock.mockResolvedValue({
        success: true,
        payload: { serializedTx: '0xsignedtx' },
    });
    pushTransactionMock.mockResolvedValue({
        success: true,
        payload: { txid: '0xpushedtxid' },
    });
});

describe('signEthereumStakingTransactionNativeThunk', () => {
    it('reads the stake variant from the compose form draft and forwards it to ethereumSignTransaction', async () => {
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('stake', ETH_ACCOUNT_KEY)]: buildComposeFormDraft('stake', '1.5'),
            },
        });

        const result = await dispatchFlow(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });

        const signCall = ethereumSignTransactionMock.mock.calls[0][0];
        expect(signCall.transaction.to).toBe(POOL_ADDRESS);
        // 1.5 ETH = 1.5 * 10^18 wei = 1500000000000000000 = 0x14d1120d7b160000
        expect(signCall.transaction.value).toBe('0x14d1120d7b160000');
        expect(signCall.transaction.data).toBe(buildStakeData());
    });

    it('passes value=0 and unstake calldata for an unstake variant', async () => {
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('unstake', ETH_ACCOUNT_KEY)]: buildComposeFormDraft(
                    'unstake',
                    '1.5',
                ),
            },
        });

        const result = await dispatchFlow(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'unstake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });

        const signCall = ethereumSignTransactionMock.mock.calls[0][0];
        expect(signCall.transaction.to).toBe(POOL_ADDRESS);
        expect(signCall.transaction.value).toBe('0x0');
        expect(signCall.transaction.data).toBe(
            buildUnstakeData('1500000000000000000', UNSTAKE_INTERCHANGES),
        );
    });

    it('uses the accounting contract address for a claim variant', async () => {
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('claim', ETH_ACCOUNT_KEY)]: buildComposeFormDraft('claim', '0'),
            },
        });

        const result = await dispatchFlow(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'claim',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({ ok: true, txid: '0xpushedtxid' });

        const signCall = ethereumSignTransactionMock.mock.calls[0][0];
        expect(signCall.transaction.to).toBe(ACCOUNTING_ADDRESS);
        expect(signCall.transaction.value).toBe('0x0');
        expect(signCall.transaction.data).toBe(buildClaimWithdrawRequestData());
    });

    it('fails when the compose form draft is missing', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({ formDrafts: {} });

        const result = await dispatchFlow(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Compose draft for stake is missing.',
            },
        });
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('fails when the account is not an ethereum account', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({
            accounts: [cardanoAccount],
            formDrafts: {
                [getFormDraftKey('stake', CARDANO_ACCOUNT_KEY)]: buildComposeFormDraft(
                    'stake',
                    '1',
                ),
            },
        });

        const result = await dispatchFlow(store, {
            accountKey: CARDANO_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Ethereum account not found.' },
        });
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('fails when the precomposed transaction has no feeLimit', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('stake', ETH_ACCOUNT_KEY)]: buildComposeFormDraft('stake', '1'),
            },
        });

        const result = await dispatchFlow(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction({ feeLimit: undefined }),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Selected fee level is missing gas limit.',
            },
        });
        expect(ethereumSignTransactionMock).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('returns push-transaction-pending-conflict when push fails with a replacement message', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        pushTransactionMock.mockResolvedValue({
            success: false,
            error: { message: 'could not replace existing tx' },
        });
        const store = buildStore({
            formDrafts: {
                [getFormDraftKey('stake', ETH_ACCOUNT_KEY)]: buildComposeFormDraft('stake', '1'),
            },
        });

        const result = await dispatchFlow(store, {
            accountKey: ETH_ACCOUNT_KEY,
            stakeType: 'stake',
            precomposedTransaction: buildPrecomposedTransaction(),
        });

        expect(result).toMatchObject({
            ok: false,
            error: {
                error: 'push-transaction-pending-conflict',
                metadata: { error: { message: 'could not replace existing tx' } },
            },
        });
        errorSpy.mockRestore();
    });
});
