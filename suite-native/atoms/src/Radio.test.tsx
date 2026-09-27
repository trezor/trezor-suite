import { type PropsWithChildren } from 'react';
import { View as MockView } from 'react-native';

import { type RadioButtonProps } from '@expo/ui/jetpack-compose';
import { type ButtonProps, type ImageProps } from '@expo/ui/swift-ui';

import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { Radio as AndroidRadio, RadioIndicator as AndroidRadioIndicator } from './Radio.android';
import { Radio as IOSRadio, RadioIndicator as IOSRadioIndicator } from './Radio.ios';

jest.mock('@expo/ui/swift-ui', () => ({
    Host: ({ children }: PropsWithChildren) => children,
    Button: ({ role: _, ...props }: ButtonProps) => (
        <MockView {...props} testID={props.testID ?? 'native-radio'} />
    ),
    Image: (props: ImageProps) => <MockView {...props} testID="native-radio-image" />,
}));

jest.mock('@expo/ui/jetpack-compose', () => ({
    Host: ({ children }: PropsWithChildren) => children,
    RadioButton: (props: RadioButtonProps) => <MockView {...props} testID="native-radio" />,
}));

describe.each([
    { platform: 'iOS', Component: IOSRadio, changeProp: 'onPress' },
    { platform: 'Android', Component: AndroidRadio, changeProp: 'onClick' },
])('$platform Radio', ({ Component, changeProp }) => {
    it('preserves the selected value type and waits for the parent to accept selection', async () => {
        const onPress = jest.fn();
        const { getByTestId, rerender } = await renderWithBasicProvider(
            <Component value={0} isChecked={false} onPress={onPress} />,
        );
        const initialProps = getByTestId('native-radio').props;

        await act(() => getByTestId('native-radio').props[changeProp]());

        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith(0);
        expect(getByTestId('native-radio').props).toEqual(initialProps);

        await rerender(<Component value={0} isChecked onPress={onPress} />);

        expect(getByTestId('native-radio').props).not.toEqual(initialProps);
    });

    it.each([{ isDisabled: true }, { disabled: true }])(
        'ignores stale native presses when disabled through %p',
        async disabledProps => {
            const onPress = jest.fn();
            const { getByTestId } = await renderWithBasicProvider(
                <Component value="option" onPress={onPress} {...disabledProps} />,
            );

            await act(() => getByTestId('native-radio').props[changeProp]());

            expect(onPress).not.toHaveBeenCalled();
        },
    );

    it('preserves custom Pressable gestures through the legacy fallback', async () => {
        const onLongPress = jest.fn();
        const onPress = jest.fn();
        const { getByTestId, queryByTestId } = await renderWithBasicProvider(
            <Component
                value="option"
                onPress={onPress}
                onLongPress={onLongPress}
                testID="radio"
                accessibilityLabel="Option"
            />,
        );

        expect(queryByTestId('native-radio')).not.toBeOnTheScreen();

        await fireEvent(getByTestId('radio'), 'longPress');
        await fireEvent.press(getByTestId('radio'));

        expect(onLongPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith('option');
    });
});

describe('native Radio semantics', () => {
    it('preserves the native testing identifier on each platform', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <>
                <IOSRadio value="ios" onPress={jest.fn()} testID="ios-radio" />
                <AndroidRadio value="android" onPress={jest.fn()} testID="android-radio" />
            </>,
        );

        expect(getByTestId('ios-radio')).toBeOnTheScreen();
        expect(getByTestId('native-radio').props.modifiers).toEqual(
            expect.arrayContaining([{ $type: 'testID', testID: 'android-radio' }]),
        );
    });

    it('uses the selected button trait on iOS and keeps its image decorative', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <IOSRadio value="option" isChecked onPress={jest.fn()} accessibilityLabel="Option" />,
        );

        expect(getByTestId('native-radio').props.modifiers).toEqual(
            expect.arrayContaining([
                { $type: 'accessibilityAddTraits', traits: ['isSelected'] },
                { $type: 'accessibilityLabel', label: 'Option' },
            ]),
        );
        expect(getByTestId('native-radio-image').props.modifiers).toEqual(
            expect.arrayContaining([{ $type: 'accessibilityHidden', hidden: true }]),
        );
    });

    it('selects the same typed value through Android accessibility activation', async () => {
        const onPress = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <AndroidRadio value={42} isChecked onPress={onPress} accessibilityLabel="Option" />,
        );

        await fireEvent(
            getByRole('radio', { name: 'Option', checked: true }),
            'accessibilityAction',
            {
                nativeEvent: { actionName: 'activate' },
            },
        );

        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith(42);
    });

    it('renders an iOS indicator without a nested button', async () => {
        const { getByTestId, queryByTestId } = await renderWithBasicProvider(
            <IOSRadioIndicator isChecked testID="indicator" />,
        );

        expect(getByTestId('indicator')).toBeOnTheScreen();
        expect(queryByTestId('native-radio')).not.toBeOnTheScreen();
    });

    it('renders an Android indicator with no native click handler', async () => {
        const { getByTestId } = await renderWithBasicProvider(<AndroidRadioIndicator isChecked />);

        expect(
            getByTestId('native-radio', { includeHiddenElements: true }).props.onClick,
        ).toBeUndefined();
        expect(getByTestId('native-radio', { includeHiddenElements: true }).props.selected).toBe(
            true,
        );
    });
});
