import { getTranslation } from '@suite-native/intl';

import { BuyGeneralErrorScreen } from './BuyGeneralErrorScreen';
import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn() }),
    useRoute: () => ({ name: 'BuyGeneralErrorScreen' }),
}));

describe('BuyGeneralErrorScreen', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders unknown error text', () => {
        const { getByText } = renderWithTradingProvider(<BuyGeneralErrorScreen />);

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
    });

    it('logs console.error on mount', () => {
        renderWithTradingProvider(<BuyGeneralErrorScreen />);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'TradingBuyPreviewScreen: No quote or providerMetadata specified',
        );

        consoleErrorSpy.mockRestore();
    });
});
