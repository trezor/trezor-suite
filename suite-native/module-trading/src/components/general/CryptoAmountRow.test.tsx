import type { CryptoId } from 'invity-api';

import { CryptoAmountRow, type CryptoAmountRowProps } from './CryptoAmountRow';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('CryptoAmountRow', () => {
    const renderCryptoAmountRow = async (overriders: Partial<CryptoAmountRowProps>) =>
        await renderWithTradingProvider(
            <CryptoAmountRow cryptoId={'bitcoin' as CryptoId} direction="from" {...overriders} />,
        );

    it('should render nothing for unknown cryptoId', async () => {
        const { toJSON } = await renderCryptoAmountRow({ cryptoId: 'unknown' as CryptoId });

        expect(toJSON()).toBeNull();
    });

    it('renders amount with minus prefix for "from" direction', async () => {
        const { getByText } = await renderCryptoAmountRow({ amount: '0.001' });

        expect(getByText('-0.001 BTC')).toBeOnTheScreen();
    });

    it('renders amount with plus prefix for "to" direction', async () => {
        const { getByText } = await renderCryptoAmountRow({ amount: '0.001', direction: 'to' });

        expect(getByText('+0.001 BTC')).toBeOnTheScreen();
    });

    it('does not render amount text when amount is undefined', async () => {
        const { queryByText } = await renderCryptoAmountRow({});

        expect(queryByText(/^[-+]/)).toBeNull();
    });

    it('does not render amount text when amount is empty string', async () => {
        const { queryByText } = await renderCryptoAmountRow({ amount: '' });

        expect(queryByText(/^[-+]/)).toBeNull();
    });

    it('renders amount text when amount is 0', async () => {
        const { queryByText } = await renderCryptoAmountRow({ amount: '0' });

        expect(queryByText('-0 BTC')).toBeOnTheScreen();
    });
});
