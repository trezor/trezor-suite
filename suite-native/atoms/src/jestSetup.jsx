import { Pressable as MockPressable, View as MockView } from 'react-native';

jest.mock('./Input/NativeTextInput', () => jest.requireActual('./Input/NativeTextInput.tsx'));

jest.mock('./Button/NativeButton', () => ({
    supportsNativeButton: true,
    NativeButton: ({ isDisabled, isLoading, accessibilityState, onPress, ...props }) => (
        <MockPressable
            {...props}
            accessibilityRole="button"
            accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: isLoading }}
            disabled={isDisabled}
            onPress={isDisabled ? undefined : () => onPress?.()}
        />
    ),
}));

jest.mock('./Skeleton/BoxSkeleton', () => ({
    BoxSkeleton: props => <MockView {...props} testID="BoxSkeleton" />,
}));

// Skia.Path.Make that is used in HoldToConfirmButton is not included in the @shopify/react-native-skia mock
// so we need to mock the whole component to not break the UI tests.
jest.mock('./HoldToConfirmButton', () => ({
    HoldToConfirmButton: props => <MockView {...props} testID="HoldToConfirmButton" />,
}));

jest.mock('./DiscreetText/DiscreetCanvas', () => ({
    DiscreetCanvas: () => null,
}));
