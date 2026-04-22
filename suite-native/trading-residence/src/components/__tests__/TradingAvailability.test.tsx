import { renderWithProviders } from '@suite-native/test-utils';

import { TradingAvailability } from '../TradingAvailability';

let mockIsTradingAvailableForForm: boolean;

jest.mock('../../hooks/useIsTradingAvailableForForm', () => ({
    useIsTradingAvailableForForm: () => mockIsTradingAvailableForForm,
}));

describe('TradingAvailability', () => {
    const renderTradingAvailability = () =>
        renderWithProviders(<TradingAvailability />, { providers: ['intl'] });

    it('should render negative message when selected country is not whitelisted', () => {
        mockIsTradingAvailableForForm = false;

        const { getByText } = renderTradingAvailability();

        expect(getByText("Trading isn't available")).toBeOnTheScreen();
    });

    it('should render positive message when selected country is whitelisted', () => {
        mockIsTradingAvailableForForm = true;

        const { getByText } = renderTradingAvailability();

        expect(getByText('Trading is available')).toBeOnTheScreen();
    });
});
