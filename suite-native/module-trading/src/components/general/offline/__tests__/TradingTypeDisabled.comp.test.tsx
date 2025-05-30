import { TradingType } from '@suite-common/trading';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingTypeDisabled, TradingTypeDisabledProps } from '../TradingTypeDisabled';

describe('TradingTypeDisabled', () => {
    const renderTradingTypeDisabled = (props: TradingTypeDisabledProps) =>
        renderWithBasicProvider(<TradingTypeDisabled {...props} />);

    it.each<[TradingType, string]>([
        ['buy', 'Buy disabled'],
        ['exchange', 'Swap disabled'],
        ['sell', 'Sell disabled'],
    ])('should render correct title for %s', (tradingType, expectedTitle) => {
        const { getByText } = renderTradingTypeDisabled({ tradingType });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });
});
