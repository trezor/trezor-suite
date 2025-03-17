import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { BuyForm } from '../BuyForm';

describe('BuyForm', () => {
    const renderBuyForm = (preloadedState: PreloadedState) =>
        renderWithStoreProviderAsync(<BuyForm />, { preloadedState });

    it('should render when buy data are not preloaded', async () => {
        const { queryByText, getAllByText, getByLabelText } = await renderBuyForm({});

        expect(queryByText('Buy')).toBeDefined();
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
        expect(queryByText('Receive account')).toBeDefined();
        expect(queryByText('Payment method')).toBeDefined();
        expect(queryByText('Country of residence')).toBeDefined();
        expect(queryByText('Provider')).toBeDefined();
        expect(queryByText('Continue')).toBeDefined();
        // payment method, country of residence and provider
        expect(getAllByText('Not selected').length).toBe(3);
        // receive account needs coin to be selected
        expect(queryByText('Select coin first')).toBeDefined();
    });

    it('should render with default values', async () => {
        const { queryByText, getByLabelText } = await renderBuyForm({
            wallet: { tradingNew: getInitializedTradingState() },
        });
        expect(queryByText('Buy')).toBeDefined();

        expect(getByLabelText('Select coin')).toHaveTextContent(/BTC/);

        expect(queryByText('Receive account')).toBeDefined();
        expect(queryByText('Not selected')).toBeDefined();

        expect(queryByText('Country of residence')).toBeDefined();
        expect(queryByText('🇨🇿 Czech Republic')).toBeDefined();

        expect(queryByText('Provider')).toBeDefined();
        expect(queryByText('Continue')).toBeDefined();
    });
});
