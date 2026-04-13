import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    cexdirectFloatingQuote,
    getWalletState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import {
    ExchangeProviderPicker,
    type ExchangeProviderPickerProps,
} from '../ExchangeProviderPicker';

describe('ExchangeProviderPicker', () => {
    let preloadedState: PreloadedState;

    const renderExchangeProviderPicker = (props: Partial<ExchangeProviderPickerProps>) =>
        renderWithStoreProvider(
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

    it('should render nothing when no quote is selected and isLoading is false', () => {
        const { toJSON } = renderExchangeProviderPicker({});

        expect(toJSON()).toBeNull();
    });

    it('should render skeleton when quotes are being fetched', () => {
        const { getByText, getByLabelText } = renderExchangeProviderPicker({
            isLoading: true,
        });

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByLabelText('Fetching offers...')).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', () => {
        const { getByText } = renderExchangeProviderPicker({
            selectedValue: mercuryoFixedWorstQuote,
        });

        expect(getByText('Provider')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
