import { Text as MockText } from 'react-native';

// avoid some unexpected re-renders in tests by disabling this hook logic
jest.mock('./hooks/general/useMountedRecentlyFlag', () => ({
    useMountedRecentlyFlag: () => false,
}));

jest.mock('./hooks/general/useFocusedValueWatch', () => ({
    useFocusedValueWatch: () => false,
}));

jest.mock('./components/general/CryptoToFiatValueBadge', () => ({
    CryptoToFiatValueBadge: ({ amount, cryptoId }: { amount?: string; cryptoId?: string }) => (
        <MockText>
            {amount}-{cryptoId}
        </MockText>
    ),
}));
