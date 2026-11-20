import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowApproveStepHeader } from './ExchangeFlowApproveStepHeader';

describe('ExchangeFlowApproveStepHeader', () => {
    it('renders the approve step title and description with the coin symbol', async () => {
        await renderWithBasicProvider(<ExchangeFlowApproveStepHeader coinSymbol="USDT" />);

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.title'),
            ),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
    });
});
