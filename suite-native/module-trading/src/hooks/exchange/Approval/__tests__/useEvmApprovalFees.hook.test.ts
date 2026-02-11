import { AccountKey } from '@suite-common/wallet-types';
import {
    PreloadedState,
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { useEvmApprovalFees } from '../useEvmApprovalFees';

const mockUnwrap = jest.fn(() => Promise.resolve({}));

jest.mock('../../../../thunks', () => ({
    composeEvmApprovalFeeLevelsThunk: (payload: unknown) => ({
        type: 'composeEvmApprovalFeeLevelsThunkMock',
        payload,
        unwrap: mockUnwrap,
    }),
}));

describe('useEvmApprovalFees', () => {
    let store: TestStore;
    let preloadedState: PreloadedState;

    const dexQuoteWithApprovalData = {
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

    beforeEach(() => {
        mockUnwrap.mockReset().mockResolvedValue({});

        preloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'eth-account-1' as AccountKey;
        preloadedState.wallet!.trading!.exchange!.preselectedQuote = dexQuoteWithApprovalData;

        store = initStore(preloadedState).store;
    });

    const renderUseEvmApprovalFees = (params?: Parameters<typeof useEvmApprovalFees>[0]) =>
        renderHookWithStoreProviderAsync(() => useEvmApprovalFees(params), { store });

    it('should return isLoading true when fee is undefined', async () => {
        const { result } = await renderUseEvmApprovalFees();

        expect(result.current).toEqual(
            expect.objectContaining({
                fee: undefined,
                error: null,
                isLoading: true,
                composeFees: expect.any(Function),
            }),
        );
    });

    it('should return fee and isLoading false when composed transaction info is available', async () => {
        preloadedState!.wallet!.trading!.composedTransactionInfo = {
            composed: { fee: '50000' },
        };
        store = initStore(preloadedState).store;

        const { result } = await renderUseEvmApprovalFees();

        expect(result.current.fee).toBe('50000');
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('should return translated error when composing fails', async () => {
        mockUnwrap.mockRejectedValue(new Error('compose failed'));

        const { result } = await renderUseEvmApprovalFees();

        expect(result.current.error).toBe('Failed to estimate approval fees. Please try again.');
        expect(result.current.isLoading).toBe(true);
    });

    it('should accept approvalTypeOverride parameter', async () => {
        const { result } = await renderUseEvmApprovalFees({ approvalTypeOverride: 'ZERO' });

        expect(result.current).toEqual(
            expect.objectContaining({
                composeFees: expect.any(Function),
            }),
        );
    });
});
