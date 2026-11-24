import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangePreviewScreenHeader } from './ExchangePreviewScreenHeader';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn() }),
}));

describe('ExchangePreviewScreenHeader', () => {
    it('renders the trade title', async () => {
        await renderWithBasicProvider(<ExchangePreviewScreenHeader />);

        expect(
            screen.getByText(getTranslation('moduleTrading.tradingExchangeFlowScreen.screenTitle')),
        ).toBeOnTheScreen();
    });
});
