import { TradingScreenHeader } from './TradingScreenHeader';
import { renderWithTradingProvider } from '../../test-utils/tradingTestUtils';

describe('TradingScreenHeader', () => {
    it('should render the header when the amount input is not active', async () => {
        const renderer = await renderWithTradingProvider(<TradingScreenHeader />, {
            overrides: { wallet: { trading: { isAmountInputActive: false } } },
        });

        expect(renderer.toJSON()).not.toBeNull();
    });

    it('should render nothing when the amount input is active', async () => {
        const renderer = await renderWithTradingProvider(<TradingScreenHeader />, {
            overrides: { wallet: { trading: { isAmountInputActive: true } } },
        });

        expect(renderer.toJSON()).toBeNull();
    });
});
