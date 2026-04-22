import { type TradingType } from '@suite-common/trading';
import { renderWithProviders } from '@suite-native/test-utils';

import { TradingTypeDisabled, type TradingTypeDisabledProps } from '../TradingTypeDisabled';

describe('TradingTypeDisabled', () => {
    const renderTradingTypeDisabled = (props: TradingTypeDisabledProps) =>
        renderWithProviders(<TradingTypeDisabled {...props} />, { providers: ['intl'] });

    it.each<[TradingType, string]>([
        ['buy', 'Buy disabled'],
        ['exchange', 'Swap disabled'],
        ['sell', 'Sell disabled'],
    ])('should render correct title for %s', (tradingType, expectedTitle) => {
        const { getByText } = renderTradingTypeDisabled({ tradingType });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });
});
