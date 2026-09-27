import { type ComponentType, type ReactNode } from 'react';
import {
    Dimensions,
    Pressable as MockPressable,
    Text as MockText,
    View as MockView,
    Platform,
    Text,
} from 'react-native';

import { act, fireEvent, renderWithBasicProvider, within } from '@suite-native/test-utils';

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
    Text: MockText,
    Button: ({ onPress, children, modifiers }: MockSwiftButtonProps) => (
        <MockPressable
            testID="native-control"
            onPress={onPress}
            disabled={modifiers?.find(modifier => modifier.$type === 'disabled')?.disabled}
            accessibilityRole="button"
            {...{ modifiers }}
        >
            {children}
        </MockPressable>
    ),
}));

jest.mock('@expo/ui/jetpack-compose', () => {
    const control =
        (variant: string) =>
        ({ onClick, children, enabled }: MockComposeButtonProps) => (
            <MockPressable
                testID="native-control"
                onPress={onClick}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityHint={variant}
            >
                {children}
            </MockPressable>
        );

    return {
        Host: MockView,
        Box: MockView,
        Text: MockText,
        Button: control('filled'),
        FilledTonalButton: control('tonal'),
        FilledIconButton: control('filled-icon'),
        FilledTonalIconButton: control('tonal-icon'),
        TextButton: control('text'),
    };
});

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

    it('uses a native icon control with a platform shape', async () => {
        const { getByTestId } = await renderButton({ variant: 'icon', priority: 'secondary' });
        const control = getByTestId('native-control', { includeHiddenElements: true });

        if (platform === 'android') {
            expect(control.props.accessibilityHint).toBe('tonal-icon');
        } else {
            expect(control.props.modifiers).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ $type: 'buttonBorderShape', shape: 'circle' }),
                ]),
            );
        }
    });

    it('renders the visible text inside the native text button so it receives native pressed feedback', async () => {
        const onPress = jest.fn();
        const { getByTestId, getByRole } = await renderButton({
            variant: 'text',
            textLabel: 'Continue',
            accessibilityLabel: 'Continue',
            onPress,
        });
        const control = getByTestId('native-control', { includeHiddenElements: true });
        expect(
            within(control).getByText('Continue', { includeHiddenElements: true }),
        ).toBeOnTheScreen();
        expect(getByRole('button', { name: 'Continue' })).toBeOnTheScreen();
        if (platform === 'android') expect(control.props.accessibilityHint).toBe('text');
        await fireEvent.press(control);
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('keeps visible native text in sync with uncapped system font scaling', async () => {
        const originalDimensions = Dimensions.get('window');
        await act(() => {
            Dimensions.set({ window: { ...originalDimensions, fontScale: 1 } });
        });

        const { getByTestId, unmount } = await renderButton({
            variant: 'text',
            textLabel: 'Continue',
        });
        const getNativeFontSize = () => {
            const control = getByTestId('native-control', { includeHiddenElements: true });
            const label = within(control).getByText('Continue', { includeHiddenElements: true });

            return platform === 'ios'
                ? label.props.modifiers.find(({ $type }: { $type: string }) => $type === 'font')
                      .size
                : label.props.style.fontSize;
        };
        const baseFontSize = getNativeFontSize();
        expect(baseFontSize).toBeGreaterThan(0);

        try {
            for (const fontScale of [1.8, 2.8]) {
                await act(() => {
                    Dimensions.set({ window: { ...originalDimensions, fontScale } });
                });

                // Compose uses sp; SwiftUI's explicit point size needs the same scale as RN text.
                expect(getNativeFontSize()).toBeCloseTo(
                    baseFontSize * (platform === 'ios' ? fontScale : 1),
                );
            }
        } finally {
            await unmount();
            await act(() => {
                Dimensions.set({ window: originalDimensions });
            });
        }
    });
});
