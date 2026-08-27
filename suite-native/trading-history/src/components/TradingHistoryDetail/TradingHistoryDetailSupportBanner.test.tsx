import { Linking } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { userEvent, waitFor } from '@suite-native/test-utils-store';
import { exchangeMercuryo } from '@suite-native/trading-fixtures';

import { TradingHistoryDetailSupportBanner } from './TradingHistoryDetailSupportBanner';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

describe('TradingHistoryDetailSupportBanner', () => {
    const mockCanOpenURL = jest.spyOn(Linking, 'canOpenURL');
    const mockOpenURL = jest.spyOn(Linking, 'openURL');

    beforeEach(() => {
        jest.clearAllMocks();
        mockCanOpenURL.mockResolvedValue(true);
    });

    it('opens the provider support website', async () => {
        const { getByTestId, getByText } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailSupportBanner
                providerName={exchangeMercuryo.name}
                tradeType="exchange"
            />,
        );

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.supportBanner.title')),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradeHistory.detail.actionButton.contactProvider', {
                    providerName: exchangeMercuryo.companyName,
                }),
            ),
        ).toBeOnTheScreen();

        await userEvent.press(getByTestId('@trading-history/detail/support/button'));

        await waitFor(() => {
            expect(mockOpenURL).toHaveBeenCalledWith(exchangeMercuryo.supportUrl);
        });
    });

    it('does not render without a provider support website', () => {
        const { toJSON } = renderWithTradingHistoryProvider(
            <TradingHistoryDetailSupportBanner
                providerName="unknown-provider"
                tradeType="exchange"
            />,
        );

        expect(toJSON()).toBeNull();
    });
});
