import { View as MockView } from 'react-native';

// The upstream mock returns null for system fonts, which are available synchronously on native.
jest.spyOn(require('@shopify/react-native-skia'), 'matchFont').mockImplementation(
    ({ fontSize }) => ({
        measureText: text => ({
            x: 0,
            y: -fontSize,
            width: text.length * fontSize,
            height: fontSize,
        }),
    }),
);

jest.mock('./Skeleton/BoxSkeleton', () => ({
    BoxSkeleton: props => <MockView {...props} testID="BoxSkeleton" />,
}));

// Skia.Path.Make that is used in HoldToConfirmButton is not included in the @shopify/react-native-skia mock
// so we need to mock the whole component to not break the UI tests.
jest.mock('./HoldToConfirmButton', () => ({
    HoldToConfirmButton: props => <MockView {...props} testID="HoldToConfirmButton" />,
}));
