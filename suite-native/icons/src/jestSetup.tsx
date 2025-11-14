import { View as MockView } from 'react-native';

// Skia.Path.Make that is used in CryptoIconWithPercentage is not included in the @shopify/react-native-skia mock
// so we need to mock the whole component to not break the UI tests.
jest.mock('./CryptoIconWithPercentage', () => ({
    CryptoIconWithPercentage: () => <MockView testID="CryptoIconWithPercentage" />,
}));
