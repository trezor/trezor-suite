import type { CryptoId, ExchangeTrade } from 'invity-api';

import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import {
    type AccountKey,
    type TokenAddress,
    type TokenInfoBranded,
} from '@suite-common/wallet-types';
import { type PreloadedState, type TestStore, initStore } from '@suite-native/test-utils';
import { selectAccountTokenInfo } from '@suite-native/tokens';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { clearTradingStateThunk, composeEvmApprovalFeeLevelsThunk } from '../thunks';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    default: {
        blockchainEstimateFee: jest.fn().mockResolvedValue({
            success: true,
            payload: {
                levels: [{ feeLimit: '52000' }],
            },
        }),
        composeTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: [
                {
                    type: 'final',
                    totalSpent: '100000',
                    fee: '21000',
                    feePerByte: '1',
                    feeLimit: '21000',
                    estimatedFeeLimit: '21000',
                    bytes: 250,
                },
            ],
        }),
        ethereumSignTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: {
                serializedTx: '0x1234567890abcdef',
            },
        }),
        getAccountInfo: jest.fn().mockResolvedValue({
            success: true,
            payload: {
                availableBalance: '1000000',
            },
        }),
    },
}));

const mockPrecomposedLevels = {
    normal: {
        type: 'final' as const,
        fee: '21000',
        feePerByte: '20',
        feeLimit: '52000',
        estimatedFeeLimit: '52000',
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        token: undefined,
        totalSpent: '0',
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
        outputs: [],
    },
};

const mockTokenInfo = {
    standard: 'ERC20' as const,
    name: 'USDC',
    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
    symbol: 'usdc',
    decimals: 6,
    balance: '100000000',
} as TokenInfoBranded;

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actual,
        composeAllowanceTransactionThunk: () => () =>
            Promise.resolve({
                type: '@common/wallet-core/approval/composeAllowanceTransactionThunk/fulfilled',
                payload: mockPrecomposedLevels,
                meta: {
                    requestId: 'test-request-id',
                    requestStatus: 'fulfilled' as const,
                },
            }),
    };
});

jest.mock('@suite-native/tokens', () => ({
    ...jest.requireActual('@suite-native/tokens'),
    selectAccountTokenInfo: jest.fn(() => mockTokenInfo),
}));

describe('thunks', () => {
    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(selectAccountTokenInfo).mockReturnValue(mockTokenInfo);
    });

    describe('clearTradingStateThunk', () => {
        it('should clear last error message for all trade types', async () => {
            const thunk = clearTradingStateThunk();
            await thunk(dispatch, getState, extra);

            expect(dispatch).toHaveBeenCalledWith(
                tradingSellActions.setLastErrorMessage(undefined),
            );
            expect(dispatch).toHaveBeenCalledWith(
                tradingExchangeActions.setLastErrorMessage(undefined),
            );
            expect(dispatch).toHaveBeenCalledWith(tradingBuyActions.setLastErrorMessage(undefined));
        });
    });

    describe('composeEvmApprovalFeeLevelsThunk', () => {
        let store: TestStore;

        const dexQuoteWithApprovalData: ExchangeTrade = {
            ...exchangeQuotes[3],
            isDex: true,
            sendStringAmount: '100',
            send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
            dexTx: {
                from: '0x0000000000000000000000000000000000000000',
                to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
                data: '0x095ea7b3000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee570000000000000000000000000000000000000000000000000000000005f5e100',
                value: '0x0',
            },
        };

        const feeInfo = {
            blockHeight: 0,
            blockTime: 15,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 0,
            dustLimit: -1,
            levels: [{ label: 'normal' as const, feePerUnit: '20', blocks: 1 }],
        };

        beforeEach(() => {
            const walletState = getWalletState({ tradeType: 'exchange' });
            walletState.trading.exchange.tradingAccountKey = 'eth-account-1' as AccountKey;

            const preloadedState: PreloadedState = {
                wallet: walletState,
                device: {
                    selectedDevice: {
                        state: { staticSessionId: 'device1@test:123' },
                        features: { major_version: 2, minor_version: 6, patch_version: 0 },
                    },
                },
            };
            store = initStore(preloadedState).store;
        });

        it('should reject when dexTx data is missing', async () => {
            const quoteWithoutDexTx = {
                ...dexQuoteWithApprovalData,
                dexTx: undefined,
            } as ExchangeTrade;

            const ethAccount = store
                .getState()
                .wallet.accounts.find(a => a.key === ('eth-account-1' as AccountKey));

            const result = await store.dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote: quoteWithoutDexTx,
                    account: ethAccount!,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('rejected');
            expect(result.payload).toBe('DEX quote with dexTx data is required');
        });

        it('should compose allowance fee levels for a DEX quote', async () => {
            const ethAccount = store
                .getState()
                .wallet.accounts.find(a => a.key === ('eth-account-1' as AccountKey));

            const result = await store.dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote: dexQuoteWithApprovalData,
                    account: ethAccount!,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('fulfilled');
        });
    });
});
