import { Text } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { exchangeOneInchFusion, exchangeOneInchFusionPlus } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangeEIP712Info, type ExchangeEIP712InfoProps } from '../ExchangeEIP712Info';

describe('ExchangeEIP712Info', () => {
    const renderExchangeEIP712Info = (
        exchange: string,
        children?: ExchangeEIP712InfoProps['children'],
    ) =>
        renderWithTradingProvider(
            <ExchangeEIP712Info exchange={exchange}>{children}</ExchangeEIP712Info>,
            {
                tradeType: 'exchange',
            },
        );

    it('should render the provider name for Fusion+', () => {
        const { getByText } = renderExchangeEIP712Info('1inchfusionplus');

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText(exchangeOneInchFusionPlus.companyName)).toBeOnTheScreen();
    });

    it('should render the provider name for Fusion', () => {
        const { getByText } = renderExchangeEIP712Info('1inchfusion');

        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
        expect(getByText(exchangeOneInchFusion.companyName)).toBeOnTheScreen();
    });

    it('should render all three bullet points', () => {
        const { getByText } = renderExchangeEIP712Info('1inchfusionplus');

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

    it('should render children', () => {
        const { getByText } = renderExchangeEIP712Info(
            '1inchfusionplus',
            <Text>child content</Text>,
        );

        expect(getByText('child content')).toBeOnTheScreen();
    });
});
