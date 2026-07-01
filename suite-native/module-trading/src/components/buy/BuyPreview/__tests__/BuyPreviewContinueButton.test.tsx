import { getTranslation } from '@suite-native/intl';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { BuyPreviewContinueButton } from '../BuyPreviewContinueButton';

describe('BuyPreviewContinueButton', () => {
    it('renders button with company name', () => {
        const { getByText } = renderWithTradingProvider(
            <BuyPreviewContinueButton companyName="MoonPay" />,
            { tradeType: 'buy' },
        );

        expect(
            getByText(
                getTranslation('moduleTrading.tradingBuyPreviewScreen.buyVia', {
                    companyName: 'MoonPay',
                }),
            ),
        ).toBeOnTheScreen();
    });
});
