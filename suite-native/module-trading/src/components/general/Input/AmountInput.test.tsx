import { useState } from 'react';

import { fireEvent, renderWithBasicProvider, screen, userEvent } from '@suite-native/test-utils';
import { palette } from '@trezor/theme';

import {
    AMOUNT_INPUT_CONTENT_TEST_ID,
    AMOUNT_INPUT_TEST_ID,
    AmountInput,
    type AmountInputProps,
} from './AmountInput';

// AmountInput is controlled, so the typed text is displayed only after the value is updated.
const ControlledAmountInput = ({
    value: initialValue,
    onChangeText,
    ...props
}: AmountInputProps) => {
    const [value, setValue] = useState(initialValue);

    const handleChangeText = (text: string | undefined) => {
        setValue(text);
        onChangeText(text);
    };

    return <AmountInput {...props} value={value} onChangeText={handleChangeText} />;
};

describe('AmountInput', () => {
    const renderAmountInput = (props: Partial<AmountInputProps>) =>
        renderWithBasicProvider(
            <ControlledAmountInput
                onChangeText={jest.fn()}
                accessibilityLabel="INPUT"
                {...props}
            />,
        );

    type ExpectedTextMetrics = { fontSize: number; lineHeight: number };

    const expectTextMetrics = (
        element: ReturnType<typeof screen.getByLabelText>,
        { fontSize, lineHeight }: ExpectedTextMetrics,
    ) => {
        expect(element).toHaveStyle({ fontSize });
        expect(screen.getByTestId(AMOUNT_INPUT_CONTENT_TEST_ID)).toHaveStyle({
            minHeight: lineHeight,
        });
    };

    it('should respect maxLength property', async () => {
        const changeTextMock = jest.fn();
        const { getByLabelText } = await renderAmountInput({
            maxLength: 5,
            onChangeText: changeTextMock,
        });

        await userEvent.type(getByLabelText('INPUT'), '1234567890');

        expect(getByLabelText('INPUT')).toHaveDisplayValue('12,345');
        expect(changeTextMock).toHaveBeenLastCalledWith('12345');
    });

    it('should have no limit by default', async () => {
        const { getByLabelText } = await renderAmountInput({});

        await userEvent.type(
            getByLabelText('INPUT'),
            '12345678901234567890123456789012345678901234567890',
        );

        expect(getByLabelText('INPUT')).toHaveDisplayValue(
            '12,345,678,901,234,567,890,123,456,789,012,345,678,901,234,567,890',
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

    it('should keep the cursor at the end of the displayed amount', async () => {
        const { getByLabelText } = await renderAmountInput({ value: '1234.5' });

        expect(getByLabelText('INPUT')).toHaveDisplayValue('1,234.5');
        expect(getByLabelText('INPUT').props.selection).toEqual({ start: 7, end: 7 });
    });

    it('should ignore an edit that is not at the end', async () => {
        const changeTextMock = jest.fn();
        const { getByLabelText } = await renderAmountInput({
            value: '1234',
            onChangeText: changeTextMock,
        });

        await fireEvent.changeText(getByLabelText('INPUT'), '91,234');

        expect(changeTextMock).not.toHaveBeenCalled();
        expect(getByLabelText('INPUT')).toHaveDisplayValue('1,234');
    });

    describe('text selection', () => {
        const selectText = (start: number, end: number) =>
            fireEvent(screen.getByLabelText('INPUT'), 'selectionChange', {
                nativeEvent: { selection: { start, end } },
            });

        it('should keep selected text selected', async () => {
            await renderAmountInput({ value: '1234' });

            await selectText(0, 2);

            expect(screen.getByLabelText('INPUT').props.selection).toEqual({ start: 0, end: 2 });
        });

        it('should move a cursor placed in the middle back to the end', async () => {
            await renderAmountInput({ value: '1234' });

            await selectText(1, 1);

            expect(screen.getByLabelText('INPUT').props.selection).toEqual({ start: 5, end: 5 });
        });

        it.each([
            ['typed digit', '5', '5'],
            ['pasted amount', '1.5', '1.5'],
            ['deletion', '', undefined],
        ])(
            'should replace the whole selected text with %s',
            async (_, nextDisplayedAmount, expected) => {
                const changeTextMock = jest.fn();
                await renderAmountInput({ value: '1234', onChangeText: changeTextMock });

                await selectText(0, 5);
                await fireEvent.changeText(screen.getByLabelText('INPUT'), nextDisplayedAmount);

                expect(changeTextMock).toHaveBeenLastCalledWith(expected);
            },
        );

        it('should ignore an edit of partially selected text', async () => {
            const changeTextMock = jest.fn();
            await renderAmountInput({ value: '1234', onChangeText: changeTextMock });

            await selectText(0, 2);
            await fireEvent.changeText(screen.getByLabelText('INPUT'), '234');

            expect(changeTextMock).not.toHaveBeenCalled();
            expect(screen.getByLabelText('INPUT')).toHaveDisplayValue('1,234');
        });

        it('should not limit native length while text is selected', async () => {
            await renderAmountInput({ value: '1.23', maxDecimals: 2 });

            expect(screen.getByLabelText('INPUT').props.maxLength).toBe(4);

            await selectText(0, 4);

            expect(screen.getByLabelText('INPUT').props.maxLength).toBeUndefined();
        });
    });

    it('should have default color for valid input value', async () => {
        const { getByLabelText } = await renderAmountInput({ value: '1' });

        expect(getByLabelText('INPUT')).toHaveStyle({ color: palette.lightCoolGreyAlpha900 });
    });

    it('should have alert color for invalid input value', async () => {
        const { getByLabelText } = await renderAmountInput({ value: '1', hasError: true });

        expect(getByLabelText('INPUT')).toHaveStyle({ color: palette.lightRed700 });
    });

    it('should apply hitSlop to the wrapper instead of the text input', async () => {
        const hitSlop = { top: 16 };
        const { getByLabelText } = await renderAmountInput({ hitSlop });

        expect(screen.getByTestId(AMOUNT_INPUT_TEST_ID)).toHaveProp('hitSlop', hitSlop);
        expect(getByLabelText('INPUT')).not.toHaveProp('hitSlop');
    });

    it('should have font size of 34 before layout events', async () => {
        const { getByLabelText } = await renderAmountInput({});

        expectTextMetrics(getByLabelText('INPUT'), { fontSize: 34, lineHeight: 41 });
    });

    describe('font size scaling on content change', () => {
        let input: ReturnType<Awaited<ReturnType<typeof renderAmountInput>>['getByLabelText']>;
        let box: ReturnType<Awaited<ReturnType<typeof renderAmountInput>>['getByTestId']>;
        let content: ReturnType<Awaited<ReturnType<typeof renderAmountInput>>['getByTestId']>;

        beforeEach(async () => {
            const { getByLabelText, getByTestId } = await renderAmountInput({
                value: '1234567890',
            });
            input = getByLabelText('INPUT');
            box = getByTestId(AMOUNT_INPUT_TEST_ID);
            content = getByTestId(AMOUNT_INPUT_CONTENT_TEST_ID);

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
            expectTextMetrics(input, { fontSize: 34, lineHeight: 41 });
        });

        it.each([
            [120, 28, 34],
            [150, 22, 27],
            [200, 17, 20],
            [250, 17, 20],
        ])(
            'should downscale font when not enough space is available for content with width %i',
            async (contentWidth, expectedFontSize, expectedLineHeight) => {
                await fireEvent(content, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: contentWidth,
                        },
                    },
                });

                expectTextMetrics(input, {
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
                await fireEvent(content, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 200,
                        },
                    },
                });
                await fireEvent(content, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: contentWidth,
                        },
                    },
                });

                expectTextMetrics(input, {
                    fontSize: expectedFontSize,
                    lineHeight: expectedLineHeight,
                });
            },
        );

        it.each([100, 80])(
            'should not upscale until hysteresis is reached for content with width %i',
            async contentWidth => {
                await fireEvent(content, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: 200,
                        },
                    },
                });
                await fireEvent(content, 'layout', {
                    nativeEvent: {
                        layout: {
                            width: contentWidth,
                        },
                    },
                });

                expectTextMetrics(input, { fontSize: 17, lineHeight: 20 });
            },
        );

        it('should not divide by zero', async () => {
            await fireEvent(content, 'layout', {
                nativeEvent: {
                    layout: {
                        width: 0,
                    },
                },
            });

            expectTextMetrics(input, { fontSize: 34, lineHeight: 41 });
        });

        it('should use full sized font when available space is equal zero', async () => {
            await fireEvent(box, 'layout', {
                nativeEvent: {
                    layout: {
                        width: 0,
                    },
                },
            });

            expectTextMetrics(input, { fontSize: 34, lineHeight: 41 });
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

        it('should ignore decimal separator when limit is 0', async () => {
            const { getByLabelText } = await renderAmountInput({ onChangeText, maxDecimals: 0 });

            await userEvent.type(getByLabelText('INPUT'), '12.5');

            expect(onChangeText).toHaveBeenLastCalledWith('125');
            expect(onChangeText).not.toHaveBeenCalledWith(expect.stringContaining('.'));
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
