import { type ComponentType, type ReactNode } from 'react';
import { Pressable as MockPressable, View as MockView, Platform, Text } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { NativeButton as AndroidButton } from './NativeButton.android';
import { NativeButton as IOSButton } from './NativeButton.ios';
import { type NativeButtonProps } from './nativeButtonTypes';

type MockSwiftButtonProps = {
    onPress?: () => void;
    children?: ReactNode;
    modifiers?: { $type: string; disabled?: boolean }[];
};

type MockComposeButtonProps = {
    onClick?: () => void;
    children?: ReactNode;
    enabled: boolean;
};

jest.unmock('./NativeButton');

jest.mock('@expo/ui/swift-ui', () => ({
    Host: MockView,
    HStack: MockView,
    Button: ({ onPress, children, modifiers }: MockSwiftButtonProps) => (
        <MockPressable
            testID="native-control"
            onPress={onPress}
            disabled={modifiers?.find(modifier => modifier.$type === 'disabled')?.disabled}
            accessibilityRole="button"
        >
            {children}
        </MockPressable>
    ),
}));

jest.mock('@expo/ui/jetpack-compose', () => ({
    Host: MockView,
    Box: MockView,
    Button: ({ onClick, children, enabled }: MockComposeButtonProps) => (
        <MockPressable
            testID="native-control"
            onPress={onClick}
            disabled={!enabled}
            accessibilityRole="button"
        >
            {children}
        </MockPressable>
    ),
    FilledTonalButton: ({ onClick, children, enabled }: MockComposeButtonProps) => (
        <MockPressable
            testID="native-control"
            onPress={onClick}
            disabled={!enabled}
            accessibilityRole="button"
        >
            {children}
        </MockPressable>
    ),
}));

type ButtonPlatform = {
    platform: 'ios' | 'android';
    Component: ComponentType<NativeButtonProps>;
};

describe.each<ButtonPlatform>([
    { platform: 'ios', Component: IOSButton },
    { platform: 'android', Component: AndroidButton },
])('NativeButton on $platform', ({ platform, Component }) => {
    const originalPlatform = Platform.OS;

    const renderButton = (props: Partial<NativeButtonProps> = {}) =>
        renderWithBasicProvider(
            <Component
                size="large"
                isDisabled={false}
                isLoading={false}
                isFullWidth={false}
                testID="button"
                {...props}
            >
                <Text>Continue</Text>
            </Component>,
        );

    beforeEach(() => {
        Platform.OS = platform;
    });

    afterEach(() => {
        Platform.OS = originalPlatform;
    });

    it('exposes one named accessible button with a custom React Native label', async () => {
        const { getAllByRole, getByRole } = await renderButton();

        expect(getAllByRole('button')).toHaveLength(1);
        expect(getByRole('button', { name: 'Continue' })).toBeOnTheScreen();
    });

    it('invokes the callback once for a native control press', async () => {
        const onPress = jest.fn();
        const { getByTestId } = await renderButton({ onPress });

        await fireEvent.press(getByTestId('native-control', { includeHiddenElements: true }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('invokes the callback once for a screen reader activation', async () => {
        const onPress = jest.fn();
        const { getByRole } = await renderButton({ onPress });
        const button = getByRole('button');

        if (platform === 'ios') {
            await fireEvent(button, 'accessibilityTap');
        } else {
            await fireEvent(button, 'accessibilityAction', {
                nativeEvent: { actionName: 'activate' },
            });
        }

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('disables the native control and screen reader activation while loading', async () => {
        const onPress = jest.fn();
        const { getByRole, getByTestId } = await renderButton({
            onPress,
            isDisabled: true,
            isLoading: true,
        });
        const button = getByRole('button', { busy: true });
        const nativeControl = getByTestId('native-control', { includeHiddenElements: true });

        expect(button).toBeDisabled();
        expect(nativeControl).toBeDisabled();
        expect(nativeControl.props.onPress).toBeUndefined();

        if (platform === 'ios') {
            await fireEvent(button, 'accessibilityTap');
        } else {
            await fireEvent(button, 'accessibilityAction', {
                nativeEvent: { actionName: 'activate' },
            });
        }

        expect(onPress).not.toHaveBeenCalled();
    });

    it('keeps the existing flex layout and full width style', async () => {
        const { getByRole } = await renderButton({ flex: 1, isFullWidth: true });

        expect(getByRole('button')).toHaveStyle({ flex: 1, width: '100%' });
    });
});
