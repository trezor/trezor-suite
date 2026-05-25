import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';
import { getWalletState } from '@suite-native/trading-fixtures';

import { useMaxSpendableAmount } from '../useMaxSpendableAmount';

const mockCalculateFeeLevelsMaxAmountThunk = jest.fn();

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    calculateFeeLevelsMaxAmountThunk: (...args: unknown[]) =>
        mockCalculateFeeLevelsMaxAmountThunk(...args),
}));

describe('useMaxSpendableAmount', () => {
    const btcAccountKey = 'btc-account-1' as AccountKey;
    const ethAccountKey = 'eth-account-1' as AccountKey;
    const usdcTokenContract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

    const renderUseMaxSpendableAmount = ({
        accountKey,
        tokenContract,
    }: Parameters<typeof useMaxSpendableAmount>[0]) =>
        renderHookWithStoreProvider(
            () =>
                useMaxSpendableAmount({
                    accountKey,
                    tokenContract,
                }),
            {
                preloadedState: {
                    wallet: getWalletState(),
                },
            },
        );

    const mockMaxAmountThunkResult = ({
        normal,
        economy,
    }: {
        normal?: string;
        economy?: string;
    }) => {
        const unwrap = jest.fn().mockResolvedValue({ normal, economy });

        mockCalculateFeeLevelsMaxAmountThunk.mockReturnValue({
            type: 'calculateFeeLevelsMaxAmountThunk',
            unwrap,
        });

        return unwrap;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should keep max spendable amount undefined without account key', () => {
        const { result } = renderUseMaxSpendableAmount({});

        expect(result.current.maxSpendableAmount).toBeUndefined();
        expect(mockCalculateFeeLevelsMaxAmountThunk).not.toHaveBeenCalled();
    });

    it('should use token balance when token balance is available', async () => {
        const { result } = renderUseMaxSpendableAmount({
            accountKey: ethAccountKey,
            tokenContract: usdcTokenContract,
        });

        await waitFor(() => {
            expect(result.current.maxSpendableAmount).toBe('1');
        });

        expect(mockCalculateFeeLevelsMaxAmountThunk).not.toHaveBeenCalled();
    });

    it('should calculate max spendable amount for native asset', async () => {
        mockMaxAmountThunkResult({ normal: '0.009', economy: '0.008' });
        const { result } = renderUseMaxSpendableAmount({
            accountKey: btcAccountKey,
        });

        await waitFor(() => {
            expect(result.current.maxSpendableAmount).toBe('0.009');
        });
    });

    it('should fall back to economy fee level when normal max amount is missing', async () => {
        mockMaxAmountThunkResult({ normal: undefined, economy: '0.008' });

        const { result } = renderUseMaxSpendableAmount({
            accountKey: btcAccountKey,
        });

        await waitFor(() => {
            expect(result.current.maxSpendableAmount).toBe('0.008');
        });
    });
});
