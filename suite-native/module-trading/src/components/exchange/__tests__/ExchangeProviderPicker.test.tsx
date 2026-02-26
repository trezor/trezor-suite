// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeProviderPicker, ExchangeProviderPickerProps } from '../ExchangeProviderPicker';

describe('ExchangeProviderPicker', () => {
    let preloadedState: PreloadedState;

    const renderExchangeProviderPicker = (props: Partial<ExchangeProviderPickerProps>) =>
        renderWithStoreProviderAsync(
            <ExchangeProviderPicker
                isLoading={false}
                selectedValue={undefined}
                handleProviderPress={jest.fn()}
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
        const { toJSON } = await renderExchangeProviderPicker({});

        expect(toJSON()).toBeNull();
    });

    it('should render skeleton when quotes are being fetched', async () => {
        const { getByText, getByLabelText } = await renderExchangeProviderPicker({
            isLoading: true,
        });

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', async () => {
        const { getByText } = await renderExchangeProviderPicker({
            selectedValue: exchangeQuotes[0],
        });

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render KYC warning for provider with "KYC-required"', async () => {
        const { getByText } = await renderExchangeProviderPicker({
            selectedValue: exchangeQuotes[2],
        });

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });

    it('should not render KYC provider warning for providers with "noKYC"', async () => {
        const { queryByText } = await renderExchangeProviderPicker({
            selectedValue: exchangeQuotes[0],
        });

        expect(queryByText('This provider requires to verify identity.')).toBeNull();
    });
});
