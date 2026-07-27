import { type FormState, type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { BTC_ACCOUNT_KEY, ETH_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';
import { useMaxSpendableAmount } from '../useMaxSpendableAmount';

const mockCalculateFeeLevelsMaxAmountThunk = jest.fn();

jest.mock('../../thunks', () => ({
    ...jest.requireActual('../../thunks'),
    calculateFeeLevelsMaxAmountThunk: (...args: unknown[]) =>
        mockCalculateFeeLevelsMaxAmountThunk(...args),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFeeInfoThunk: (payload: unknown) => ({
        type: 'updateFeeInfoThunkMock',
        payload,
        unwrap: () => Promise.resolve(undefined),
    }),
}));

describe('useMaxSpendableAmount', () => {
    const btcAccountKey = BTC_ACCOUNT_KEY;
    const ethAccountKey = ETH_ACCOUNT_KEY;
    const usdcTokenContract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

    const customFormState: FormState = {
        outputs: [
            {
                type: 'payment',
                address: 'bc1qcustomaddress',
                amount: '0.1',
                label: 'Custom output',
                token: null,
                fiat: '',
                currency: { label: '', value: '' },
            },
        ],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
        options: [],
        isCoinControlEnabled: true,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const renderUseMaxSpendableAmount = ({
        accountKey,
        tokenContract,
        formState,
        symbol,
    }: Parameters<typeof useMaxSpendableAmount>[0]) =>
        renderHookWithStoreProvider(
            () =>
                useMaxSpendableAmount({
                    accountKey,
                    tokenContract,
                    formState,
                    symbol,
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
        const { result } = renderUseMaxSpendableAmount({ symbol: null });

        expect(result.current.maxSpendableAmount).toBeUndefined();
        expect(mockCalculateFeeLevelsMaxAmountThunk).not.toHaveBeenCalled();
    });

    it('should use token balance when token balance is available', async () => {
        const { result } = renderUseMaxSpendableAmount({
            accountKey: ethAccountKey,
            tokenContract: usdcTokenContract,
            symbol: 'etc',
        });

        await waitFor(() => {
            expect(result.current.maxSpendableAmount).toBe('1');
        });

        expect(mockCalculateFeeLevelsMaxAmountThunk).not.toHaveBeenCalled();
    });

    it('should calculate max spendable amount for native asset with default form state', async () => {
        mockMaxAmountThunkResult({ normal: '0.009', economy: '0.008' });
        const { result } = renderUseMaxSpendableAmount({
            accountKey: btcAccountKey,
            symbol: 'btc',
        });

        await waitFor(() => {
            expect(result.current.maxSpendableAmount).toBe('0.009');
        });
    });

    it('should calculate max spendable amount with provided form state', async () => {
        mockMaxAmountThunkResult({ normal: '0.009', economy: '0.008' });

        const { result } = renderUseMaxSpendableAmount({
            accountKey: btcAccountKey,
            formState: customFormState,
            symbol: 'btc',
        });

        await waitFor(() => {
            expect(mockCalculateFeeLevelsMaxAmountThunk).toHaveBeenCalledWith(
                {
                    formState: customFormState,
                    accountKey: btcAccountKey,
                },
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
            expect(result.current.maxSpendableAmount).toBe('0.009');
        });
    });

    it('should fall back to economy fee level when normal max amount is missing', async () => {
        mockMaxAmountThunkResult({ normal: undefined, economy: '0.008' });

        const { result } = renderUseMaxSpendableAmount({
            accountKey: btcAccountKey,
            symbol: 'btc',
        });

        await waitFor(() => {
            expect(result.current.maxSpendableAmount).toBe('0.008');
        });
    });

    it('should skip native asset calculation when calculation is disabled', () => {
        const { result } = renderUseMaxSpendableAmount({
            accountKey: btcAccountKey,
            symbol: 'btc',
            enabled: false,
        });

        expect(result.current.maxSpendableAmount).toBeUndefined();
        expect(mockCalculateFeeLevelsMaxAmountThunk).not.toHaveBeenCalled();
    });
});
