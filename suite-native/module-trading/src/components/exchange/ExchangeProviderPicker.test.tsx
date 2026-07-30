import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type PreloadedStatePartial } from '@suite-native/test-utils-store';
import { getWalletState, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { ExchangeProviderPicker, type ExchangeProviderPickerProps } from './ExchangeProviderPicker';
import { type TradingTestPreloadedState } from '../../test-utils/tradingTestUtils';

describe('ExchangeProviderPicker', () => {
    let preloadedState: PreloadedStatePartial<TradingTestPreloadedState>;

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

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('moduleTrading.tradingScreen.quotesLoadingLabel')),
        ).toBeOnTheScreen();
    });

    it('should render provider when quote is selected', () => {
        const { getByText } = renderExchangeProviderPicker({
            selectedValue: mercuryoFixedWorstQuote,
        });

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });
});
