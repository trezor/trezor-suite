import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { screen, within } from '@suite-native/test-utils-store';

import {
    ExchangeFlowStepsLayout,
    type ExchangeFlowStepsLayoutProps,
} from './ExchangeFlowStepsLayout';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ key: 'TradingExchangeFlow', name: 'TradingExchangeFlow', params: {} }),
    useNavigation: () => ({ setOptions: jest.fn() }),
}));

const REVOKE_NEXT_TITLE = getTranslation(
    'moduleTrading.tradingExchangeFlowScreen.revokeStep.nextStepTitle',
);
const SWAP_NEXT_TITLE = getTranslation(
    'moduleTrading.tradingExchangeFlowScreen.swapStep.nextStepTitle',
);

const renderLayout = ({
    approvalStatus,
    currentStep,
}: Pick<ExchangeFlowStepsLayoutProps, 'approvalStatus' | 'currentStep'>) =>
    renderWithTradingProvider(
        <ExchangeFlowStepsLayout
            approvalStatus={approvalStatus}
            currentStep={currentStep}
            header={<Text>Header</Text>}
            footer={<Text>Footer</Text>}
        >
            <Text>Current step content</Text>
        </ExchangeFlowStepsLayout>,
        { tradeType: 'exchange' },
    );

describe('ExchangeFlowStepsLayout', () => {
    it('renders the header, footer and current step content', async () => {
        await renderLayout({ approvalStatus: 'needs_approval', currentStep: 'approval' });

        expect(screen.getByText('Header')).toBeOnTheScreen();
        expect(screen.getByText('Footer')).toBeOnTheScreen();
        expect(screen.getByTestId('@step-cards/current')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 1, stepCount: 2 }) +
                'Current step content',
        );
    });

    it('renders the finished and next step cards around the current step', async () => {
        await renderLayout({ approvalStatus: 'needs_revoke', currentStep: 'approval' });

        expect(
            within(screen.getByTestId('@step-cards/finished')).getByText(REVOKE_NEXT_TITLE),
        ).toBeOnTheScreen();
        expect(screen.getByTestId('@step-cards/next')).toHaveTextContent(
            getTranslation('stepCards.stepper', { stepNumber: 3, stepCount: 3 }) + SWAP_NEXT_TITLE,
        );
    });
});
