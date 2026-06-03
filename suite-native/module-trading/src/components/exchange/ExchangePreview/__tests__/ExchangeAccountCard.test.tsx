import {
    btc1NormalAccount,
    eth1NormalAccount,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangeAccountCard } from '../ExchangeAccountCard';

describe('ExchangeAccountCard', () => {
    const renderCard = (
        overrides: Partial<React.ComponentProps<typeof ExchangeAccountCard>> = {},
    ) =>
        renderWithTradingProvider(
            <ExchangeAccountCard
                title="From"
                account={eth1NormalAccount}
                direction="from"
                cryptoId={mercuryoFixedWorstQuote.send}
                amount={undefined}
                {...overrides}
            />,
            { tradeType: 'exchange' },
        );

    it('renders title', () => {
        const { getByText } = renderCard({ title: 'From Account' });

        expect(getByText('From Account')).toBeOnTheScreen();
    });

    it('renders account label', () => {
        const { getByText } = renderCard();

        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });

    it('renders amount with minus prefix for "from" direction', () => {
        const { getByText } = renderCard({ amount: '100' });

        expect(getByText('-100 USDC')).toBeOnTheScreen();
    });

    it('renders amount with plus prefix for "to" direction', () => {
        const { getByText } = renderCard({
            account: btc1NormalAccount,
            cryptoId: mercuryoFixedWorstQuote.receive,
            amount: '0.00083554',
            direction: 'to',
        });

        expect(getByText('+0.00083554 BTC')).toBeOnTheScreen();
    });

    it('does not render amount text when amount is undefined', () => {
        const { queryByText } = renderCard();

        expect(queryByText(/^[-+]/)).toBeNull();
    });

    it('renders fiat badge when amount is provided', () => {
        const { getByText } = renderCard({ amount: '100' });

        expect(getByText(`100-${mercuryoFixedWorstQuote.send}`)).toBeOnTheScreen();
    });

    it('does not render fiat badge when amount is undefined', () => {
        const { queryByText } = renderCard();

        expect(queryByText(new RegExp(`-${mercuryoFixedWorstQuote.send}`))).toBeNull();
    });

    it('returns null when cryptoId is not specified', () => {
        const { toJSON } = renderCard({ cryptoId: undefined });

        expect(toJSON()).toBeNull();
    });
});
