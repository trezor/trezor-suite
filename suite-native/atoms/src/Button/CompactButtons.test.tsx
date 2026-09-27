import { type GestureResponderEvent } from 'react-native';

import { Translation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { IconButton } from './IconButton';
import { TextButton } from './TextButton';

describe('IconButton', () => {
    it('uses a no-event callback for an explicitly native accessible icon button', async () => {
        const onPress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <IconButton native iconName="x" accessibilityLabel="Close" onPress={onPress} />,
        );

        await fireEvent.press(getByRole('button', { name: 'Close' }));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith();
    });

    it('preserves the React Native press event when native mode is not requested', async () => {
        const onPress = jest.fn((event: GestureResponderEvent) => event.preventDefault());
        const { getByLabelText } = await renderWithBasicProvider(
            <IconButton iconName="x" accessibilityLabel="Close" onPress={onPress} />,
        );

        await fireEvent.press(getByLabelText('Close'));
        expect(onPress).toHaveBeenCalledWith(
            expect.objectContaining({ nativeEvent: expect.any(Object) }),
        );
    });

    it('keeps long press and custom hit areas on the legacy pressable', async () => {
        const onLongPress = jest.fn();
        const onPress = jest.fn();
        const { getByLabelText } = await renderWithBasicProvider(
            <IconButton
                native
                iconName="copy"
                accessibilityLabel="Copy"
                hitSlop={12}
                onLongPress={onLongPress}
                onPress={onPress}
            />,
        );

        const button = getByLabelText('Copy');
        await fireEvent(button, 'longPress');
        expect(button.props.hitSlop).toBe(12);
        expect(onLongPress).toHaveBeenCalledTimes(1);
        await fireEvent.press(button);
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith();
    });

    it.each([{ isLoading: true }, { isDisabled: true }, { disabled: true }])(
        'disables activation for %p',
        async props => {
            const onPress = jest.fn();
            const { getByRole } = await renderWithBasicProvider(
                <IconButton
                    native
                    iconName="x"
                    accessibilityLabel="Close"
                    onPress={onPress}
                    {...props}
                />,
            );

            const button = getByRole('button');
            expect(button).toBeDisabled();
            await fireEvent.press(button);
            expect(onPress).not.toHaveBeenCalled();
        },
    );
});

describe('TextButton', () => {
    it('exposes the translated label and invokes a native callback once', async () => {
        const onPress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <TextButton native onPress={onPress}>
                <Translation id="generic.buttons.learnMore" />
            </TextButton>,
        );

        await fireEvent.press(getByRole('button', { name: 'Learn more' }));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith();
    });

    it('preserves decorated content on the legacy renderer with an accurate accessible label', async () => {
        const onPress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <TextButton native iconRight="arrowSquareOut" isUnderlined isDotted onPress={onPress}>
                <Translation id="generic.buttons.learnMore" />
            </TextButton>,
        );

        await fireEvent.press(getByRole('button', { name: 'Learn more' }));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith();
    });

    it('preserves the legacy event callback', async () => {
        const onPress = jest.fn((event: GestureResponderEvent) => event.preventDefault());
        const { getByText } = await renderWithBasicProvider(
            <TextButton onPress={onPress}>Continue</TextButton>,
        );

        await fireEvent.press(getByText('Continue'));
        expect(onPress).toHaveBeenCalledWith(
            expect.objectContaining({ nativeEvent: expect.any(Object) }),
        );
    });

    it('keeps loading, disabled semantics and existing test identifiers', async () => {
        const onPress = jest.fn();
        const { getByRole, getByTestId } = await renderWithBasicProvider(
            <TextButton native isLoading onPress={onPress} testID="action">
                Continue
            </TextButton>,
        );

        const button = getByRole('button', { busy: true });
        expect(button).toBeDisabled();
        expect(getByTestId('action/button')).toBeOnTheScreen();
        expect(getByTestId('action/text')).toHaveTextContent('Continue');
        expect(getByTestId('action/loading')).toBeOnTheScreen();
        await fireEvent.press(button);
        expect(onPress).not.toHaveBeenCalled();
    });
});
