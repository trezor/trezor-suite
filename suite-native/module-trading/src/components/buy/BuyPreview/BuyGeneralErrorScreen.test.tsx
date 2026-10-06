import { getTranslation } from '@suite-native/intl';

import { BuyGeneralErrorScreen } from './BuyGeneralErrorScreen';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

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

    it('renders unknown error text', async () => {
        const { getByText } = await renderWithTradingProvider(<BuyGeneralErrorScreen />);

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
    });

    it('logs console.error on mount', async () => {
        await renderWithTradingProvider(<BuyGeneralErrorScreen />);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'TradingBuyPreviewScreen: No quote or providerMetadata specified',
        );

        consoleErrorSpy.mockRestore();
    });
});
