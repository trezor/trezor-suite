import { fireEvent, renderWithBasicProvider, userEvent } from '@suite-native/test-utils';
import { palette } from '@trezor/theme';

import { AMOUNT_INPUT_TEST_ID, AmountInput, type AmountInputProps } from './AmountInput';

describe('AmountInput', () => {
    const renderAmountInput = async (props: Partial<AmountInputProps>) =>
        await renderWithBasicProvider(
            <AmountInput
                inputTransformer={v => v}
                onChangeText={jest.fn()}
                accessibilityLabel="INPUT"
                {...props}
            />,
        );

    it('should respect maxLength property', async () => {
        const changeTextMock = jest.fn();
        const { getByLabelText } = await renderAmountInput({
            maxLength: 5,
            onChangeText: changeTextMock,
        });

        await userEvent.type(getByLabelText('INPUT'), '1234567890');

        expect(getByLabelText('INPUT')).toHaveDisplayValue('12345');
        expect(changeTextMock).toHaveBeenLastCalledWith('12345');
    });

    it('should have no limit by default', async () => {
        const { getByLabelText } = await renderAmountInput({});

        await userEvent.type(
            getByLabelText('INPUT'),
            '12345678901234567890123456789012345678901234567890',
        );

        expect(getByLabelText('INPUT')).toHaveDisplayValue(
            '12345678901234567890123456789012345678901234567890',
        );
    });

    it('should call onChangeText with undefined instead of empty text', async () => {
        const changeTextMock = jest.fn();
        const { getByLabelText } = await renderAmountInput({ onChangeText: changeTextMock });
        const input = getByLabelText('INPUT');
        await userEvent.type(input, '1234567890');

        await userEvent.clear(input);

        expect(input).toHaveDisplayValue('');
        expect(changeTextMock).toHaveBeenLastCalledWith(undefined);
    });

    it('should have default color for valid input value', async () => {
        const { getByLabelText } = await renderAmountInput({ value: '1' });

        expect(getByLabelText('INPUT')).toHaveStyle({ color: palette.lightCoolGreyAlpha900 });
    });

    it('should have alert color for invalid input value', async () => {
        const { getByLabelText } = await renderAmountInput({ value: '1', hasError: true });

        expect(getByLabelText('INPUT')).toHaveStyle({ color: palette.lightRed700 });
    });

    it('should have font size of 34 before layout events', async () => {
        const { getByLabelText } = await renderAmountInput({});

        expect(getByLabelText('INPUT')).toHaveStyle({ fontSize: 34, lineHeight: 41 });
    });

    describe('font size scaling on content change', () => {
        let input: ReturnType<Awaited<ReturnType<typeof renderAmountInput>>['getByLabelText']>;
        let box: ReturnType<Awaited<ReturnType<typeof renderAmountInput>>['getByTestId']>;

        beforeEach(async () => {
            const { getByLabelText, getByTestId } = await renderAmountInput({
                value: '1234567890',
            });
            input = getByLabelText('INPUT');
            box = getByTestId(AMOUNT_INPUT_TEST_ID);

            // Simulate initial layout event
            await fireEvent(box, 'layout', {
                nativeEvent: {
                    layout: {
                        width: 120,
                    },
                },
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
            async (contentWidth, expectedFontSize, expectedLineHeight) => {
                await fireEvent(input, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: contentWidth,
                        },
                    },
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
            async (contentWidth, expectedFontSize, expectedLineHeight) => {
                await fireEvent(input, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 200,
                        },
                    },
                });
                await fireEvent(input, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: contentWidth,
                        },
                    },
                });

                expect(input).toHaveStyle({
                    fontSize: expectedFontSize,
                    lineHeight: expectedLineHeight,
                });
            },
        );

        it.each([100, 80])(
            'should not upscale until hysteresis is reached for content with width %i',
            async contentWidth => {
                await fireEvent(input, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 200,
                        },
                    },
                });
                await fireEvent(input, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: contentWidth,
                        },
                    },
                });

                expect(input).toHaveStyle({
                    fontSize: 17,
                    lineHeight: 20,
                });
            },
        );

        it('should not divide by zero', async () => {
            await fireEvent(input, 'layout', {
                nativeEvent: {
                    layout: {
                        width: 0,
                    },
                },
            });

            expect(input).toHaveStyle({
                fontSize: 34,
                lineHeight: 41,
            });
        });

        it('should use full sized font when available space is equal zero', async () => {
            await fireEvent(box, 'layout', {
                nativeEvent: {
                    layout: {
                        width: 0,
                    },
                },
            });

            expect(input).toHaveStyle({
                fontSize: 34,
                lineHeight: 41,
            });
        });
    });

    describe('maxDecimals property', () => {
        let onChangeText: jest.Mock;

        beforeEach(() => {
            onChangeText = jest.fn();
        });

        it('should not limit input value when property is not set', async () => {
            const { getByLabelText } = await renderAmountInput({ onChangeText });

            await userEvent.type(getByLabelText('INPUT'), '1234567890.123456789');

            expect(onChangeText).toHaveBeenLastCalledWith('1234567890.123456789');
        });

        it('should truncate decimals exceeding specified limit', async () => {
            const { getByLabelText } = await renderAmountInput({ onChangeText, maxDecimals: 3 });

            await userEvent.type(getByLabelText('INPUT'), '1234567890.123456789');

            expect(onChangeText).toHaveBeenLastCalledWith('1234567890.123');
        });

        it('should truncate zero decimals exceeding specified limit', async () => {
            const { getByLabelText } = await renderAmountInput({ onChangeText, maxDecimals: 3 });

            await userEvent.type(getByLabelText('INPUT'), '1234567890.100000000');

            expect(onChangeText).toHaveBeenLastCalledWith('1234567890.100');
        });

        it.each(['0', '123456', '0.1', '12345.789'])(
            'should do nothing when number of decimals is not exceeding limit, case [%s]',
            async typedValue => {
                const { getByLabelText } = await renderAmountInput({
                    onChangeText,
                    maxDecimals: 3,
                });

                await userEvent.type(getByLabelText('INPUT'), typedValue);

                expect(onChangeText).toHaveBeenLastCalledWith(typedValue);
            },
        );
    });

    describe('isLoading property', () => {
        it('should not display input and should display skeleton instead', async () => {
            const { getByTestId, queryByLabelText } = await renderAmountInput({
                isLoading: true,
                loadingAccessibilityLabel: 'LOADING',
            });

            expect(getByTestId('BoxSkeleton')).toHaveAccessibleName('LOADING');
            expect(queryByLabelText('INPUT')).toBeNull();
        });
    });
});
