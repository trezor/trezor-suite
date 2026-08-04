import { configureMockStore } from '@suite-common/test-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken, accountsActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { submitWrapNativeTokenThunk } from './wrapNativeTokenThunks';

const mockComposeYieldWrapTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();
const mockSendYieldTransaction = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldWrapTransactionThunk: (payload: unknown) =>
        mockComposeYieldWrapTransactionThunk(payload),
}));

jest.mock('@suite/modal', () => ({
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('./stablecoin-yield/signingHelpers', () => ({
    sendYieldTransaction: (payload: unknown) => mockSendYieldTransaction(payload),
}));

const account = mockWalletAccount({ symbol: 'eth' }) as Account;

const token: YieldFlowDisplayToken & { contractAddress: string } = {
    networkSymbol: 'eth',
    symbol: 'WETH',
    decimals: 18,
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
};

describe('submitWrapNativeTokenThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () =>
                Promise.resolve({
                    type: 'action-ready',
                    unsignedTransaction: '{}',
                }),
        }));
        mockOpenDeferredModal.mockImplementation(() => () => Promise.resolve({ value: false }));
    });

    it('uses the shared wrap composition from wallet-core', async () => {
        const store = configureMockStore({ extra: {}, preloadedState: {} });

        await store
            .dispatch(
                submitWrapNativeTokenThunk({
                    account,
                    token,
                    wrapAmount: '1',
                }),
            )
            .unwrap();

        expect(mockComposeYieldWrapTransactionThunk).toHaveBeenCalledWith({
            account,
            token,
            wrapAmount: '1',
        });
        expect(mockOpenDeferredModal).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'earn-yield-tx-simulation',
                data: expect.objectContaining({ flow: 'wrap' }),
            }),
        );
    });

    it('uses the parent yield flow identity when provided', async () => {
        const store = configureMockStore({ extra: {}, preloadedState: {} });
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xwrap' });

        await store
            .dispatch(
                submitWrapNativeTokenThunk({
                    account,
                    token,
                    wrapAmount: '1',
                    yieldFlow: {
                        flowKey: 'yield-flow',
                        flowType: 'deposit',
                    },
                }),
            )
            .unwrap();

        expect(mockSendYieldTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                flowKey: 'yield-flow',
                flowType: 'deposit',
            }),
        );
    });

    const getTrackedTokenUpdates = (store: ReturnType<typeof configureMockStore>) =>
        store
            .getActions()
            .filter(action => action.type === accountsActions.updateAccount.type)
            .filter(action =>
                action.payload.tokens?.some(
                    (accountToken: { contract: string }) =>
                        accountToken.contract.toLowerCase() === token.contractAddress.toLowerCase(),
                ),
            );

    const acceptModalAndSucceed = () => {
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xwrap' });
    };

    it('shows a wrap toast displaying both the native and wrapped assets', async () => {
        acceptModalAndSucceed();
        const store = configureMockStore({ extra: {}, preloadedState: {} });

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1.5' }))
            .unwrap();

        const wrapToast = store.getActions().find(action => action.payload?.type === 'tx-wrap');

        expect(wrapToast?.payload).toMatchObject({
            type: 'tx-wrap',
            txid: '0xwrap',
            metadata: {
                send: {
                    symbol: account.symbol,
                    displaySymbol: getNetworkDisplaySymbol(account.symbol),
                    amount: '1.5',
                },
                receive: {
                    symbol: account.symbol,
                    displaySymbol: token.symbol,
                    contractAddress: token.contractAddress,
                    amount: '1.5',
                },
            },
        });
    });

    it('starts tracking the wrapped native token after a successful wrap', async () => {
        acceptModalAndSucceed();
        const store = configureMockStore({ extra: {}, preloadedState: {} });

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
            .unwrap();

        const trackedTokenUpdates = getTrackedTokenUpdates(store);
        expect(trackedTokenUpdates).toHaveLength(1);
    });

    it('does not track the wrapped native token when it is already tracked', async () => {
        acceptModalAndSucceed();
        const accountWithTrackedToken = mockWalletAccount({
            symbol: 'eth',
            tokens: [
                {
                    standard: 'ERC20',
                    // stored in a different case to prove the dedupe is case-insensitive
                    contract: token.contractAddress.toLowerCase(),
                    symbol: 'WETH',
                    decimals: 18,
                },
            ],
        }) as Account;
        const store = configureMockStore({ extra: {}, preloadedState: {} });

        await store
            .dispatch(
                submitWrapNativeTokenThunk({
                    account: accountWithTrackedToken,
                    token,
                    wrapAmount: '1',
                }),
            )
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(0);
    });

    it('does not track the wrapped native token when the send fails', async () => {
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue(undefined);
        const store = configureMockStore({ extra: {}, preloadedState: {} });

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(0);
    });
});
