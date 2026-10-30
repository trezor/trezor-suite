import { View as MockView } from 'react-native';

jest.mock('./Skeleton/BoxSkeleton', () => ({
    BoxSkeleton: props => <MockView {...props} testID="BoxSkeleton" />,
}));

// Skia.Path.Make that is used in HoldToConfirmButton is not included in the @shopify/react-native-skia mock
// so we need to mock the whole component to not break the UI tests.
jest.mock('./HoldToConfirmButton', () => ({
    HoldToConfirmButton: props => <MockView {...props} testID="HoldToConfirmButton" />,
}));
