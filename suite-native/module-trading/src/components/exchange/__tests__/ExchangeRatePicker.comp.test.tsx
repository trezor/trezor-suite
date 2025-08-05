import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../../__fixtures__/walletState';
import { ExchangeRatePicker, ExchangeRatePickerProps } from '../ExchangeRatePicker';

describe('ExchangeRatePicker', () => {
    let preloadedState: PreloadedState;

    const renderExchangeRatePicker = (props: Partial<ExchangeRatePickerProps>) =>
        renderWithStoreProviderAsync(
            <ExchangeRatePicker
                isLoading={false}
                selectedValue={undefined}
                handleRatePress={jest.fn()}
                {...props}
            />,
            {
                preloadedState,
            },
        );

    beforeEach(() => {
        preloadedState = { wallet: getWalletState({ tradeType: 'exchange' }) };
    });

    it('should render nothing when no quote is selected and isLoading is false', async () => {
        const { toJSON } = await renderExchangeRatePicker({});

        expect(toJSON()).toBeNull();
    });

    it('should render skeleton when quotes are being fetched', async () => {
        const { getByText, getByLabelText } = await renderExchangeRatePicker({
            isLoading: true,
        });

        expect(getByText('Rate')).toBeOnTheScreen();
        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render rate when quote is selected', async () => {
        const { getByText } = await renderExchangeRatePicker({
            selectedValue: exchangeQuotes[0],
        });

        expect(getByText('Rate')).toBeOnTheScreen();
        expect(getByText('Fixed')).toBeOnTheScreen();
    });

    it('should render correct value for floating quote', async () => {
        const { getByText } = await renderExchangeRatePicker({
            selectedValue: exchangeQuotes[2],
        });

        expect(getByText('Floating')).toBeOnTheScreen();
    });
});
