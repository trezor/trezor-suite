import { Text } from '@suite-native/atoms';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowStepTitle, type ExchangeFlowStepTitleProps } from './ExchangeFlowStepTitle';

describe('ExchangeFlowStepTitle', () => {
    it.each<[ExchangeFlowStepTitleProps, TxKeyPath]>([
        [
            { step: 'revoke', approvalStatus: 'needs_revoke' },
            'moduleTrading.tradingExchangeFlowScreen.stepTitles.revoke',
        ],
        [
            { step: 'approval', approvalStatus: 'needs_revoke' },
            'moduleTrading.tradingExchangeFlowScreen.stepTitles.approve',
        ],
        [
            { step: 'approval', approvalStatus: 'needs_approval' },
            'moduleTrading.tradingExchangeFlowScreen.stepTitles.approve',
        ],
        [
            { step: 'approval', approvalStatus: 'needs_increase' },
            'moduleTrading.tradingExchangeFlowScreen.stepTitles.increaseLimit',
        ],
        [
            { step: 'preview', approvalStatus: 'needs_approval' },
            'moduleTrading.tradingExchangeFlowScreen.stepTitles.swap',
        ],
    ])('renders the title for %o', async (props, translationId) => {
        await renderWithBasicProvider(
            <Text>
                <ExchangeFlowStepTitle {...props} />
            </Text>,
        );

        expect(screen.getByText(getTranslation(translationId))).toBeOnTheScreen();
    });
});
