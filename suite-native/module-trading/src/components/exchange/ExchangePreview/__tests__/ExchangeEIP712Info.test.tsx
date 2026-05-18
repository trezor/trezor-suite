import { getTranslation } from '@suite-native/intl';
import { exchangeOneInchFusion, exchangeOneInchFusionPlus } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangeEIP712Info } from '../ExchangeEIP712Info';

describe('ExchangeEIP712Info', () => {
    const renderExchangeEIP712Info = (exchange: string) =>
        renderWithTradingProvider(<ExchangeEIP712Info exchange={exchange} />, {
            tradeType: 'exchange',
        });

    it('should render the provider name for Fusion+', () => {
        const { getByText } = renderExchangeEIP712Info('1inchfusionplus');

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.eip712Info.title', {
                    providerName: exchangeOneInchFusionPlus.companyName,
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('should render the provider name for Fusion', () => {
        const { getByText } = renderExchangeEIP712Info('1inchfusion');

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangePreviewScreen.eip712Info.title', {
                    providerName: exchangeOneInchFusion.companyName,
                }),
            ),
        ).toBeOnTheScreen();
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
});
