import { configureMockStore } from '@suite-common/test-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { submitUnwrapNativeTokenThunk } from './unwrapNativeTokenThunks';

const mockComposeYieldUnwrapTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();
const mockSendYieldTransaction = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldUnwrapTransactionThunk: (payload: unknown) =>
        mockComposeYieldUnwrapTransactionThunk(payload),
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

describe('submitUnwrapNativeTokenThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockComposeYieldUnwrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () =>
                Promise.resolve({
                    type: 'action-ready',
                    unsignedTransaction: '{}',
                }),
        }));
        mockOpenDeferredModal.mockImplementation(() => () => Promise.resolve({ value: false }));
    });

    it('uses the shared unwrap composition from wallet-core', async () => {
        const store = configureMockStore({ extra: {}, preloadedState: {} });

        await store
            .dispatch(
                submitUnwrapNativeTokenThunk({
                    account,
                    token,
                    unwrapAmount: '1',
                }),
            )
            .unwrap();

        expect(mockComposeYieldUnwrapTransactionThunk).toHaveBeenCalledWith({
            account,
            token,
            unwrapAmount: '1',
        });
        expect(mockOpenDeferredModal).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'earn-yield-tx-simulation',
                data: expect.objectContaining({ flow: 'unwrap' }),
            }),
        );
    });

    it('uses the parent yield flow identity when provided', async () => {
        const store = configureMockStore({ extra: {}, preloadedState: {} });
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xunwrap' });

        await store
            .dispatch(
                submitUnwrapNativeTokenThunk({
                    account,
                    token,
                    unwrapAmount: '1',
                    yieldFlow: {
                        flowKey: 'yield-flow',
                        flowType: 'redeem',
                    },
                }),
            )
            .unwrap();

        expect(mockSendYieldTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                flowKey: 'yield-flow',
                flowType: 'redeem',
            }),
        );
    });

    it('shows an unwrap toast displaying both the wrapped and native assets', async () => {
        const store = configureMockStore({ extra: {}, preloadedState: {} });
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xunwrap' });

        await store
            .dispatch(submitUnwrapNativeTokenThunk({ account, token, unwrapAmount: '1.5' }))
            .unwrap();

        const unwrapToast = store.getActions().find(action => action.payload?.type === 'tx-unwrap');

        expect(unwrapToast?.payload).toMatchObject({
            type: 'tx-unwrap',
            txid: '0xunwrap',
            metadata: {
                send: {
                    symbol: account.symbol,
                    displaySymbol: token.symbol,
                    contractAddress: token.contractAddress,
                    amount: '1.5',
                },
                receive: {
                    symbol: account.symbol,
                    displaySymbol: getNetworkDisplaySymbol(account.symbol),
                    amount: '1.5',
                },
            },
        });
    });
});
