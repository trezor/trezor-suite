import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingHistoryDetailPaymentMethodRow } from './TradingHistoryDetailPaymentMethodRow';

describe('TradingHistoryDetailPaymentMethodRow', () => {
    it.each([
        ['payment', 'paymentMethod'],
        ['payout', 'payoutMethod'],
    ] as const)('renders the %s method', async (label, translationId) => {
        const { getByLabelText, getByText } = await renderWithBasicProvider(
            <TradingHistoryDetailPaymentMethodRow
                paymentMethod={{
                    label,
                    paymentMethod: 'creditCard',
                    paymentMethodName: 'Credit Card',
                }}
            />,
        );

        expect(
            getByText(getTranslation(`moduleTrading.tradeHistory.detail.info.${translationId}`)),
        ).toBeOnTheScreen();
        expect(getByLabelText('Credit Card')).toBeOnTheScreen();
    });
});
