import { Form } from '@suite-native/forms';
import {
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithBasicProvider,
    userEvent,
} from '@suite-native/test-utils';
import { paletteV1 } from '@trezor/theme';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { TradingBuyForm } from '../../../types';
import { BuyAmountInput, TradingAmountInputProps } from '../BuyAmountInput';

describe('BuyAmountInput', () => {
    const renderBuyFormHook = () => renderHookWithStoreProviderAsync(() => useBuyForm());
    const renderTradingAmountInput = (
        props: Partial<TradingAmountInputProps>,
        form: TradingBuyForm,
    ) =>
        renderWithBasicProvider(
            <Form form={form}>
                <BuyAmountInput
                    name="fiatValue"
                    inputTransformer={v => v}
                    accessibilityLabel="INPUT"
                    {...props}
                />
            </Form>,
        );

    it('should respect maxLength property', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({ maxLength: 5 }, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1234567890');

        expect(getByLabelText('INPUT')).toHaveDisplayValue('12345');
        expect(result.current.getValues('fiatValue')).toBe('12345');
    });

    it('should have no limit by default', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(
            getByLabelText('INPUT'),
            '12345678901234567890123456789012345678901234567890',
        );

        expect(getByLabelText('INPUT')).toHaveDisplayValue(
            '12345678901234567890123456789012345678901234567890',
        );
        expect(result.current.getValues('fiatValue')).toBe(
            '12345678901234567890123456789012345678901234567890',
        );
    });

    it('should call onChange with undefined instead of empty text', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1234567890');
        expect(getByLabelText('INPUT')).toHaveDisplayValue('1234567890');

        await userEvent.clear(getByLabelText('INPUT'));
        expect(getByLabelText('INPUT')).toHaveDisplayValue('');
        expect(result.current.getValues('fiatValue')).toBe(undefined);
    });

    it('should have default color for valid input value', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1');

        expect(getByLabelText('INPUT')).toHaveStyle({ color: paletteV1.lightGray1000 });
    });

    it('should have alert color for invalid input value', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        await userEvent.type(getByLabelText('INPUT'), '1');
        act(() => {
            result.current.setError('fiatValue', { message: 'ERROR' });
        });

        expect(getByLabelText('INPUT')).toHaveStyle({ color: paletteV1.lightAccentRed700 });
    });

    it('should have font size of 34 before layout events', async () => {
        const { result } = await renderBuyFormHook();
        const { getByLabelText } = renderTradingAmountInput({}, result.current);

        expect(getByLabelText('INPUT')).toHaveStyle({ fontSize: 34, lineHeight: 41 });
    });

    describe('font size scaling on content change', () => {
        let input: ReturnType<ReturnType<typeof renderTradingAmountInput>['getByLabelText']>;
        let box: ReturnType<ReturnType<typeof renderTradingAmountInput>['getByTestId']>;

        beforeEach(async () => {
            const { result } = await renderBuyFormHook();
            const { getByLabelText, getByTestId } = renderTradingAmountInput({}, result.current);

            input = getByLabelText('INPUT');
            box = getByTestId('@trading/amountInput/wrapper');

            act(() => {
                fireEvent(box, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 120,
                        },
                    },
                });
            });
        });

        it('should have font size of 34 after initial layout events', () => {
            expect(input).toHaveStyle({ fontSize: 34, lineHeight: 41 });
        });

        it.each([
            [120, 28, 34],
            [150, 22, 27],
            [200, 17, 20],
            [250, 17, 20],
        ])(
            'should downscale font when not enough space is available for content with width %i',
            (contentWidth, expectedFontSize, expectedLineHeight) => {
                act(() => {
                    fireEvent(input, 'layout', {
                        nativeEvent: {
                            layout: {
                                width: contentWidth,
                            },
                        },
                    });
                });

                expect(input).toHaveStyle({
                    fontSize: expectedFontSize,
                    lineHeight: expectedLineHeight,
                });
            },
        );

        it.each([
            [79, 21, 25],
            [50, 34, 41],
            [10, 34, 41],
        ])(
            'should upscale font when enough space is available for content with width %i',
            (contentWidth, expectedFontSize, expectedLineHeight) => {
                act(() => {
                    fireEvent(input, 'layout', {
                        nativeEvent: {
                            layout: {
                                width: 200,
                            },
                        },
                    });
                });
                act(() => {
                    fireEvent(input, 'layout', {
                        nativeEvent: {
                            layout: {
                                width: contentWidth,
                            },
                        },
                    });
                });

                expect(input).toHaveStyle({
                    fontSize: expectedFontSize,
                    lineHeight: expectedLineHeight,
                });
            },
        );

        it.each([100, 80])(
            'should not upscale until hysteresis is reached for content with width %i',
            contentWidth => {
                act(() => {
                    fireEvent(input, 'layout', {
                        nativeEvent: {
                            layout: {
                                width: 200,
                            },
                        },
                    });
                });
                act(() => {
                    fireEvent(input, 'layout', {
                        nativeEvent: {
                            layout: {
                                width: contentWidth,
                            },
                        },
                    });
                });

                expect(input).toHaveStyle({
                    fontSize: 17,
                    lineHeight: 20,
                });
            },
        );

        it('should not divide by zero', () => {
            act(() => {
                fireEvent(input, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 0,
                        },
                    },
                });
            });

            expect(input).toHaveStyle({
                fontSize: 34,
                lineHeight: 41,
            });
        });

        it('should use full sized font when available space is equal zero', () => {
            act(() => {
                fireEvent(box, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 0,
                        },
                    },
                });
            });

            expect(input).toHaveStyle({
                fontSize: 34,
                lineHeight: 41,
            });
        });
    });

    describe('maxDecimals property', () => {
        it('should not limit input value when property is not set', async () => {
            const { result } = await renderBuyFormHook();
            const { getByLabelText } = renderTradingAmountInput({}, result.current);

            await userEvent.type(getByLabelText('INPUT'), '1234567890.123456789');
            expect(getByLabelText('INPUT')).toHaveDisplayValue('1234567890.123456789');
        });

        it('should truncate decimals exceeding specified limit', async () => {
            const { result } = await renderBuyFormHook();
            const { getByLabelText } = renderTradingAmountInput({ maxDecimals: 3 }, result.current);

            await userEvent.type(getByLabelText('INPUT'), '1234567890.123456789');
            expect(getByLabelText('INPUT')).toHaveDisplayValue('1234567890.123');
        });

        it('should truncate zero decimals exceeding specified limit', async () => {
            const { result } = await renderBuyFormHook();
            const { getByLabelText } = renderTradingAmountInput({ maxDecimals: 3 }, result.current);

            await userEvent.type(getByLabelText('INPUT'), '1234567890.100000000');
            expect(getByLabelText('INPUT')).toHaveDisplayValue('1234567890.100');
        });

        it.each(['0', '123456', '0.1', '12345.789'])(
            'should do nothing when number of decimals is not exceeding limit, case [%s]',
            async value => {
                const { result } = await renderBuyFormHook();
                const { getByLabelText } = renderTradingAmountInput(
                    { maxDecimals: 3 },
                    result.current,
                );

                await userEvent.type(getByLabelText('INPUT'), value);
                expect(getByLabelText('INPUT')).toHaveDisplayValue(value);
            },
        );
    });
});
