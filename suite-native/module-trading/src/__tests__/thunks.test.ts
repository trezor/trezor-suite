import type { ExchangeTrade } from 'invity-api';

import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { AccountKey } from '@suite-common/wallet-types';
import { TestStore, initStore } from '@suite-native/test-utils';
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
    },
}));

describe('thunks', () => {
    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
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
            send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            dexTx: {
                to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
                data: '0x095ea7b3000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee570000000000000000000000000000000000000000000000000000000005f5e100',
                value: '0x0',
            },
        };

        const feeInfo = {
            blockTime: 15,
            minFee: 1,
            maxFee: 100,
            dustLimit: -1,
            levels: [{ label: 'normal' as const, feePerUnit: '20', blocks: 1 }],
        };

        beforeEach(() => {
            const walletState = getWalletState({ tradeType: 'exchange' });
            walletState.trading.exchange.tradingAccountKey = 'eth-account-1' as AccountKey;

            store = initStore({
                wallet: walletState,
            }).store;
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
