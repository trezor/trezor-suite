import { Text } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { exchangeOneInchFusion, exchangeOneInchFusionPlus } from '@suite-native/trading-fixtures';

import { ExchangeEIP712Info, type ExchangeEIP712InfoProps } from './ExchangeEIP712Info';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('ExchangeEIP712Info', () => {
    const renderExchangeEIP712Info = async (
        exchange: string,
        children?: ExchangeEIP712InfoProps['children'],
    ) =>
        await renderWithTradingProvider(
            <ExchangeEIP712Info exchange={exchange}>{children}</ExchangeEIP712Info>,
            {
                tradeType: 'exchange',
            },
        );

    it('should render the provider name for Fusion+', async () => {
        const { getByText } = await renderExchangeEIP712Info('1inchfusionplus');

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText(exchangeOneInchFusionPlus.companyName)).toBeOnTheScreen();
    });

    it('should render the provider name for Fusion', async () => {
        const { getByText } = await renderExchangeEIP712Info('1inchfusion');

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText(exchangeOneInchFusion.companyName)).toBeOnTheScreen();
    });

    it('should render all three bullet points', async () => {
        const { getByText } = await renderExchangeEIP712Info('1inchfusionplus');

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.eip712Info.bullet1'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.eip712Info.bullet2'),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.eip712Info.bullet3'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render children', async () => {
        const { getByText } = await renderExchangeEIP712Info(
            '1inchfusionplus',
            <Text>child content</Text>,
        );

        expect(getByText('child content')).toBeOnTheScreen();
    });
});
