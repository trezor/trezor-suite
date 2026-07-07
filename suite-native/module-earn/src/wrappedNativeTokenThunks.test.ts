import { configureMockStore } from '@suite-common/test-utils';
import { WRAPPED_NATIVE, asNetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions } from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import {
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
const WETH = WRAPPED_NATIVE.eth!;

const account = mockWalletAccount({ symbol: ethSymbol }) as Account;

const signedTransaction: SignedWrappedNativeTokenTransaction = {
    serializedTx: '0xsignedtx',
    precomposedTransaction: { type: 'final', fee: '0' } as unknown as PrecomposedTransactionFinal,
    formState: {} as unknown as FormState,
};

const pushTransactionMock = TrezorConnect.pushTransaction as jest.Mock;

const buildStore = (storeAccount: Account) =>
    configureMockStore({
        preloadedState: {
            wallet: { accounts: [storeAccount], settings: { mevProtection: false } },
        },
    });

const getTrackedTokenUpdates = (store: ReturnType<typeof buildStore>) =>
    store
        .getActions()
        .filter(action => action.type === accountsActions.addAccountTokens.type)
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
