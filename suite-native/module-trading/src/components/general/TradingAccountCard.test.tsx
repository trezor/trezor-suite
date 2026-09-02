import {
    btc1NormalAccount,
    eth1NormalAccount,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { TradingAccountCard } from './TradingAccountCard';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('TradingAccountCard', () => {
    const renderCard = async (
        overrides: Partial<React.ComponentProps<typeof TradingAccountCard>> = {},
    ) =>
        await renderWithTradingProvider(
            <TradingAccountCard
                title="From"
                account={eth1NormalAccount}
                direction="from"
                cryptoId={mercuryoFixedWorstQuote.send}
                amount={undefined}
                {...overrides}
            />,
            { tradeType: 'exchange' },
        );

    it('renders title', async () => {
        const { getByText } = await renderCard({ title: 'From Account' });

        expect(getByText('From Account')).toBeOnTheScreen();
    });

    it('renders account label', async () => {
        const { getByText } = await renderCard();

        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });

    it('renders amount with minus prefix for "from" direction', async () => {
        const { getByText } = await renderCard({ amount: '100' });

        expect(getByText('-100 USDC')).toBeOnTheScreen();
    });

    it('renders amount with plus prefix for "to" direction', async () => {
        const { getByText } = await renderCard({
            account: btc1NormalAccount,
            cryptoId: mercuryoFixedWorstQuote.receive,
            amount: '0.00083554',
            direction: 'to',
        });

        expect(getByText('+0.00083554 BTC')).toBeOnTheScreen();
    });

    it('does not render amount text when amount is undefined', async () => {
        const { queryByText } = await renderCard();

        expect(queryByText(/^[-+]/)).toBeNull();
    });

    it('renders fiat badge when amount is provided', async () => {
        const { getByText } = await renderCard({ amount: '100' });

        expect(getByText(`100-${mercuryoFixedWorstQuote.send}`)).toBeOnTheScreen();
    });

    it('does not render fiat badge when amount is undefined', async () => {
        const { queryByText } = await renderCard();

        expect(queryByText(new RegExp(`-${mercuryoFixedWorstQuote.send}`))).toBeNull();
    });

    it('returns null when cryptoId is not specified', async () => {
        const { toJSON } = await renderCard({ cryptoId: undefined });

        expect(toJSON()).toBeNull();
    });
});
