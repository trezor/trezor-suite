import { configureMockStore } from '@suite-common/test-utils';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { submitWrapNativeTokenThunk } from '../wrapNativeTokenThunks';

const mockComposeYieldWrapTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldWrapTransactionThunk: (payload: unknown) =>
        mockComposeYieldWrapTransactionThunk(payload),
}));

jest.mock('@suite/modal', () => ({
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('../stablecoin-yield/signingHelpers', () => ({
    sendYieldTransaction: jest.fn(),
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
});
