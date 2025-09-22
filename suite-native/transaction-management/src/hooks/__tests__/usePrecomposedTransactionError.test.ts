import { NetworkSymbol } from '@suite-common/wallet-config';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { usePrecomposedTransactionError } from '../usePrecomposedTransactionError';

// Mock the translation function
const mockTranslate = jest.fn();

jest.mock('@suite-native/intl', () => ({
    useTranslate: () => ({
        translate: mockTranslate,
    }),
}));

describe('usePrecomposedTransactionError', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockContext = {
        networkSymbol: 'btc' as NetworkSymbol,
    };

    const mockContextWithoutNetwork = {};

    it.each([[null], [undefined], ['INVALID_ERROR'], ['']])(
        'should return null when error is %s',
        error => {
            const { result } = renderHookWithBasicProvider(() =>
                usePrecomposedTransactionError({ error, context: mockContext }),
            );

            expect(result.current).toBeNull();
            expect(mockTranslate).not.toHaveBeenCalled();
        },
    );

    it('should return translated error message for valid error', () => {
        mockTranslate.mockReturnValue('Translated error message');

        const { result } = renderHookWithBasicProvider(() =>
            usePrecomposedTransactionError({
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                context: mockContext,
            }),
        );

        expect(result.current).toBe('Translated error message');
        expect(mockTranslate).toHaveBeenCalledWith(
            'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
            { networkDisplaySymbol: 'BTC' },
        );
    });

    it('should handle context without network symbol', () => {
        mockTranslate.mockReturnValue('Translated error message');

        const { result } = renderHookWithBasicProvider(() =>
            usePrecomposedTransactionError({
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                context: mockContextWithoutNetwork,
            }),
        );

        expect(result.current).toBe('Translated error message');
        expect(mockTranslate).toHaveBeenCalledWith(
            'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
            { networkDisplaySymbol: '' },
        );
    });

    it('should handle different network symbols', () => {
        mockTranslate.mockReturnValue('Translated error message');

        const { result } = renderHookWithBasicProvider(() =>
            usePrecomposedTransactionError({
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                context: { networkSymbol: 'eth' as NetworkSymbol },
            }),
        );

        expect(result.current).toBe('Translated error message');
        expect(mockTranslate).toHaveBeenCalledWith(
            'transactionManagement.precomposedTransaction.errors.amountNotEnoughCurrencyFee',
            { networkDisplaySymbol: 'ETH' },
        );
    });
});
