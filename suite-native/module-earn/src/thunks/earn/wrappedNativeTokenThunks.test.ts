import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions, transactionsActions } from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import TrezorConnect from '@trezor/connect';
import { asGetter } from '@trezor/dependency-injection';
import { getWrappedNativeToken } from '@trezor/network-ethereum-suite-common';

import {
    type PushWrappedNativeTokenThunkDeps,
    type PushWrappedNativeTokenThunkState,
    type SignedWrappedNativeTokenTransaction,
    pushWrappedNativeTokenThunk,
} from './wrappedNativeTokenThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        pushTransaction: jest.fn(),
    },
}));

jest.mock('@suite-common/wallet-core', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/wallet-core'),
    synchronizeSentTransactionThunk: jest.fn(params => ({
        type: 'test/synchronizeSentTransactionThunk',
        payload: params,
    })),
}));

const ethSymbol = asNetworkSymbol('eth');
const WETH = getWrappedNativeToken(ethSymbol)!;

const account = mockWalletAccount({ symbol: ethSymbol }) as Account;

const signedTransaction: SignedWrappedNativeTokenTransaction = {
    serializedTx: '0xsignedtx',
    precomposedTransaction: {
        type: 'final',
        fee: '0',
        outputs: [{ address: '0x0000000000000000000000000000000000000001', amount: '0' }],
    } as unknown as PrecomposedTransactionFinal,
    formState: { selectedFee: 'custom', options: ['transactionData'] } as unknown as FormState,
};

const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;
const buildStore = (storeAccount: Account) =>
    createTestCompositionRoot<PushWrappedNativeTokenThunkDeps, PushWrappedNativeTokenThunkState>({
        preloadedState: {
            wallet: { accounts: [storeAccount], settings: { mevProtection: false } },
        },
        services: () => ({
            analytics: mockNativeAnalytics(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: asGetter(() => true),
            getTradedAccountKeys: asGetter(() => []),
        }),
    }).services.store;

const getTrackedTokenUpdates = (
    store: TestCompositionStore<PushWrappedNativeTokenThunkState, PushWrappedNativeTokenThunkDeps>,
) =>
    store
        .getActions()
        .filter(accountsActions.addAccountTokens.match)
        .filter(action =>
            action.payload.tokens?.some(
                (token: { contract: string }) =>
                    token.contract.toLowerCase() === WETH.address.toLowerCase(),
            ),
        );

describe('pushWrappedNativeTokenThunk', () => {
    beforeEach(() => {
        pushTransactionMock.mockReset();
        pushTransactionMock.mockResolvedValue({
            success: true,
            payload: { txid: '0xpushedtxid' },
        });
    });

    it.each([true, false])('registers the broadcast outcome (success: %s)', async success => {
        const store = buildStore(account);

        pushTransactionMock.mockResolvedValue(
            success
                ? { success: true, payload: { txid: 'status-txid' } }
                : { success: false, error: { message: 'backend-private-details' } },
        );
        await store.dispatch(
            pushWrappedNativeTokenThunk({ account, flowType: 'unwrap', signedTransaction }),
        );
        const outcomes = store
            .getActions()
            .filter(transactionsActions.transactionBroadcastStatus.match);
        expect(outcomes.map(action => action.payload)).toEqual([
            {
                account,
                flow: 'unwrap',
                ...(success ? { status: 'success', txid: 'status-txid' } : { status: 'error' }),
            },
        ]);
    });

    it('tracks the wrapped native token after a successful wrap', async () => {
        const store = buildStore(account);

        await store
            .dispatch(pushWrappedNativeTokenThunk({ account, flowType: 'wrap', signedTransaction }))
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(1);
    });

    it('does not track anything for an unwrap', async () => {
        const store = buildStore(account);

        await store
            .dispatch(
                pushWrappedNativeTokenThunk({ account, flowType: 'unwrap', signedTransaction }),
            )
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(0);
    });

    it('does not track the wrapped native token when it is already tracked', async () => {
        const accountWithTrackedToken = mockWalletAccount({
            symbol: ethSymbol,
            // stored in a different case to prove the dedupe is case-insensitive
            tokens: [mockAccountToken({ contract: WETH.address.toLowerCase() })],
        }) as Account;
        const store = buildStore(accountWithTrackedToken);

        await store
            .dispatch(
                pushWrappedNativeTokenThunk({
                    account: accountWithTrackedToken,
                    flowType: 'wrap',
                    signedTransaction,
                }),
            )
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(0);
    });
});
