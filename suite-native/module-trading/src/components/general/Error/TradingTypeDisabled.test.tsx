import { type TradingType } from '@suite-common/trading';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingTypeDisabled, type TradingTypeDisabledProps } from './TradingTypeDisabled';

describe('TradingTypeDisabled', () => {
    const renderTradingTypeDisabled = async (props: TradingTypeDisabledProps) =>
        await renderWithBasicProvider(<TradingTypeDisabled {...props} />);

    it.each<[TradingType, string]>([
        ['buy', 'Buy disabled'],
        ['exchange', 'Swap disabled'],
        ['sell', 'Sell disabled'],
    ])('should render correct title for %s', async (tradingType, expectedTitle) => {
        const { getByText } = await renderTradingTypeDisabled({ tradingType });

        expect(getByText(expectedTitle)).toBeOnTheScreen();
    });
});
