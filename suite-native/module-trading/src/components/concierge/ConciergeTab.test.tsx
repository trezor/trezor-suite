import { getTranslation } from '@suite-native/intl';
import { selectIsTradingConciergeEnabled } from '@suite-native/trading-state';

import { ConciergeTab } from './ConciergeTab';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingConciergeEnabled: jest.fn(),
}));

jest.mock('./ConciergeTabContent', () => ({
    ConciergeTabContent: () => null,
}));

describe('ConciergeTab', () => {
    it('should render disabled info when concierge is disabled by FFs', async () => {
        (selectIsTradingConciergeEnabled as jest.Mock).mockReturnValue(false);

        const { getByText } = await renderWithTradingProvider(<ConciergeTab />);

        expect(
            getByText(
                getTranslation('tradingAtoms.error.tradingTypeDisabledTitle', {
                    tradingType: 'Concierge',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should not render disabled message when concierge is enabled', async () => {
        (selectIsTradingConciergeEnabled as jest.Mock).mockReturnValue(true);

        const { queryByText } = await renderWithTradingProvider(<ConciergeTab />);

        expect(
            queryByText(
                getTranslation('tradingAtoms.error.tradingTypeDisabledTitle', {
                    tradingType: 'Concierge',
                }),
            ),
        ).toBeNull();
    });
});
