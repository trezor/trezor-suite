import type { CryptoId } from 'invity-api';

import { CryptoAmountRow, type CryptoAmountRowProps } from './CryptoAmountRow';
import { renderWithTradingProvider } from '../../__tests__/tradingTestUtils';

describe('CryptoAmountRow', () => {
    const renderCryptoAmountRow = (overriders: Partial<CryptoAmountRowProps>) =>
        renderWithTradingProvider(
            <CryptoAmountRow cryptoId={'bitcoin' as CryptoId} direction="from" {...overriders} />,
        );

    it('should render nothing for unknown cryptoId', () => {
        const { toJSON } = renderCryptoAmountRow({ cryptoId: 'unknown' as CryptoId });

        expect(toJSON()).toBeNull();
    });

    it('renders amount with minus prefix for "from" direction', () => {
        const { getByText } = renderCryptoAmountRow({ amount: '0.001' });

        expect(getByText('-0.001 BTC')).toBeOnTheScreen();
    });

    it('renders amount with plus prefix for "to" direction', () => {
        const { getByText } = renderCryptoAmountRow({ amount: '0.001', direction: 'to' });

        expect(getByText('+0.001 BTC')).toBeOnTheScreen();
    });

    it('does not render amount text when amount is undefined', () => {
        const { queryByText } = renderCryptoAmountRow({});

        expect(queryByText(/^[-+]/)).toBeNull();
    });

    it('does not render amount text when amount is empty string', () => {
        const { queryByText } = renderCryptoAmountRow({ amount: '' });

        expect(queryByText(/^[-+]/)).toBeNull();
    });

    it('renders amount text when amount is 0', () => {
        const { queryByText } = renderCryptoAmountRow({ amount: '0' });

        expect(queryByText('-0 BTC')).toBeOnTheScreen();
    });
});
