import { selectIsTradingConciergeEnabled } from '@suite-native/trading-state';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { ConciergeTab } from '../ConciergeTab';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingConciergeEnabled: jest.fn(),
}));

jest.mock('../ConciergeTabContent', () => ({
    ConciergeTabContent: () => null,
}));

describe('ConciergeTab', () => {
    it('should render disabled info when concierge is disabled by FFs', () => {
        (selectIsTradingConciergeEnabled as jest.Mock).mockReturnValue(false);

        const { getByText } = renderWithTradingProvider(<ConciergeTab />);

        expect(getByText('Concierge disabled')).toBeOnTheScreen();
    });

    it('should not render disabled message when concierge is enabled', () => {
        (selectIsTradingConciergeEnabled as jest.Mock).mockReturnValue(true);

        const { queryByText } = renderWithTradingProvider(<ConciergeTab />);

        expect(queryByText('Concierge disabled')).toBeNull();
    });
});
