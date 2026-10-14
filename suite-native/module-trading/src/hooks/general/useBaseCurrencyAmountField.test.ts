import { asNetworkSymbol } from '@suite-common/wallet-config';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import {
    type UseBaseCurrencyAmountFieldParams,
    useBaseCurrencyAmountField,
} from './useBaseCurrencyAmountField';
import { createTradingPreloadedState } from '../../test-utils/tradingTestUtils';

type FieldProps = Pick<
    UseBaseCurrencyAmountFieldParams,
    'rate' | 'decimals' | 'cryptoAmount' | 'typedBaseCurrencyAmount'
>;

describe('useBaseCurrencyAmountField', () => {
    const setCryptoAmount = jest.fn();
    const setTypedBaseCurrencyAmount = jest.fn();

    const defaultProps: FieldProps = {
        rate: 1000,
        decimals: 18,
        cryptoAmount: undefined,
        typedBaseCurrencyAmount: undefined,
    };

    const renderField = async (initialProps: Partial<FieldProps> = {}) =>
        await renderHookWithStoreProvider(
            (props: FieldProps) =>
                useBaseCurrencyAmountField({
                    ...props,
                    symbol: asNetworkSymbol('eth'),
                    setCryptoAmount,
                    setTypedBaseCurrencyAmount,
                }),
            {
                preloadedState: createTradingPreloadedState(),
                initialProps: { ...defaultProps, ...initialProps },
            },
        );

    beforeEach(() => {
        setCryptoAmount.mockClear();
        setTypedBaseCurrencyAmount.mockClear();
    });

    it('should set the converted crypto amount and store the typed amount', async () => {
        const { result } = await renderField();

        await act(() => {
            result.current.setBaseCurrencyAmount('250');
        });

        expect(setCryptoAmount).toHaveBeenCalledWith('0.25');
        expect(setTypedBaseCurrencyAmount).toHaveBeenCalledWith('250');
    });

    it('should display the typed amount while it matches the crypto amount', async () => {
        const { result } = await renderField({
            cryptoAmount: '0.1',
            typedBaseCurrencyAmount: '100.',
        });

        expect(result.current.baseCurrencyAmount).toBe('100.');
    });

    it('should derive the amount from the crypto amount when nothing is typed', async () => {
        const { result } = await renderField({ cryptoAmount: '0.123' });

        expect(result.current.baseCurrencyAmount).toBe('123');
    });

    it('should derive the amount from the crypto amount once the rate changes', async () => {
        const { result, rerender } = await renderField({
            cryptoAmount: '0.1',
            typedBaseCurrencyAmount: '100',
        });

        await rerender({
            ...defaultProps,
            cryptoAmount: '0.1',
            typedBaseCurrencyAmount: '100',
            rate: 1200,
        });

        expect(result.current.baseCurrencyAmount).toBe('120');
    });

    it.each([
        ['rate', { rate: undefined }],
        ['decimals', { decimals: undefined }],
    ])('should not convert without %s', async (_, props) => {
        const { result } = await renderField({ ...props, cryptoAmount: '1' });

        await act(() => {
            result.current.setBaseCurrencyAmount('100');
        });

        expect(result.current.baseCurrencyAmount).toBeUndefined();
        expect(result.current.isConversionAvailable).toBe(false);
        expect(setCryptoAmount).not.toHaveBeenCalled();
        expect(setTypedBaseCurrencyAmount).not.toHaveBeenCalled();
    });
});
