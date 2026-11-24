import { Text } from '@suite-native/atoms';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowStepTitle } from './ExchangeFlowStepTitle';
import { type ExchangeFlowStep } from '../../../utils/exchange/exchangeFlowSteps';

describe('ExchangeFlowStepTitle', () => {
    it.each<[ExchangeFlowStep, TxKeyPath]>([
        ['revoke', 'moduleTrading.tradingExchangeFlowScreen.revokeStep.nextStepTitle'],
        ['approval', 'moduleTrading.tradingExchangeFlowScreen.approveStep.nextStepTitle'],
        ['preview', 'moduleTrading.tradingExchangeFlowScreen.swapStep.nextStepTitle'],
    ])('renders the short title for the %s step', async (step, translationId) => {
        await renderWithBasicProvider(
            <Text>
                <ExchangeFlowStepTitle step={step} />
            </Text>,
        );

        expect(screen.getByText(getTranslation(translationId))).toBeOnTheScreen();
    });
});
