import { Text as MockText } from 'react-native';

jest.mock('./components/CryptoToFiatValueBadge', () => ({
    CryptoToFiatValueBadge: ({ amount, cryptoId }: { amount?: string; cryptoId?: string }) => (
        <MockText>
            {amount}-{cryptoId}
        </MockText>
    ),
}));
