import { Text, View } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { Button } from './Button';

describe('Button', () => {
    it('exposes a button and invokes its action once', async () => {
        const onPress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <Button onPress={onPress}>Continue</Button>,
        );

        await fireEvent.press(getByRole('button', { name: 'Continue' }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it.each([{ isDisabled: true }, { disabled: true }, { isLoading: true }])(
        'prevents activation while unavailable: %j',
        async disabledProps => {
            const onPress = jest.fn();
            const { getByRole } = await renderWithBasicProvider(
                <Button onPress={onPress} {...disabledProps}>
                    Continue
                </Button>,
            );

            const button = getByRole('button', { name: 'Continue' });
            await fireEvent.press(button);

            expect(button).toBeDisabled();
            expect(onPress).not.toHaveBeenCalled();
        },
    );

    it('announces busy state and keeps the loading and label test identifiers', async () => {
        const { getByRole, getByTestId } = await renderWithBasicProvider(
            <Button isLoading testID="submit">
                Continue
            </Button>,
        );

        expect(getByRole('button', { busy: true })).toBeOnTheScreen();
        expect(getByTestId('submit/loading')).toBeOnTheScreen();
        expect(getByTestId('submit/text')).toHaveTextContent('Continue');
    });

    it('preserves a custom label and its explicit accessibility description', async () => {
        const { getByRole, getByTestId } = await renderWithBasicProvider(
            <Button shouldWrapChildrenInText={false} accessibilityLabel="Select currency">
                <View testID="currency-label">
                    <Text>EUR</Text>
                </View>
            </Button>,
        );

        expect(getByRole('button', { name: 'Select currency' })).toBeOnTheScreen();
        expect(getByTestId('currency-label')).toBeOnTheScreen();
    });

    it('keeps decorative icons out of the accessible button name', async () => {
        const { getByRole } = await renderWithBasicProvider(
            <Button iconLeft="info" iconRight="arrowRight">
                Learn more
            </Button>,
        );

        expect(getByRole('button', { name: 'Learn more' })).toBeOnTheScreen();
    });

    it('preserves custom long press behavior through the React Native fallback', async () => {
        const onLongPress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <Button onLongPress={onLongPress}>Copy address</Button>,
        );

        await fireEvent(getByRole('button', { name: 'Copy address' }), 'longPress');

        expect(onLongPress).toHaveBeenCalledTimes(1);
    });
});
