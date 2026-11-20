import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowIncreaseStepHeader } from './ExchangeFlowIncreaseStepHeader';

describe('ExchangeFlowIncreaseStepHeader', () => {
    it('renders the increase step title and description with the coin symbol', async () => {
        await renderWithBasicProvider(<ExchangeFlowIncreaseStepHeader coinSymbol="USDT" />);

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.title'),
            ),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
    });
});
