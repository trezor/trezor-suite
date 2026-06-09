import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingAvailability } from '../TradingAvailability';

let mockIsTradingAvailableForForm: boolean;

jest.mock('../../hooks/useIsTradingAvailableForForm', () => ({
    useIsTradingAvailableForForm: () => mockIsTradingAvailableForForm,
}));

describe('TradingAvailability', () => {
    const renderTradingAvailability = () => renderWithBasicProvider(<TradingAvailability />);

    it('should render negative message when selected country is not whitelisted', () => {
        mockIsTradingAvailableForForm = false;

        const { getByText } = renderTradingAvailability();

        expect(
            getByText(getTranslation('tradingResidence.locationSettings.tradingUnavailable')),
        ).toBeOnTheScreen();
    });

    it('should render positive message when selected country is whitelisted', () => {
        mockIsTradingAvailableForForm = true;

        const { getByText } = renderTradingAvailability();

        expect(
            getByText(getTranslation('tradingResidence.locationSettings.tradingAvailable')),
        ).toBeOnTheScreen();
    });
});
