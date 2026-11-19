import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';

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

const REVOKE_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.revoke');
const APPROVE_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.approve');
const SWAP_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.swap');

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

    it('renders no finished card and every remaining step as a next card on the first step', async () => {
        await renderLayout({ approvalStatus: 'needs_revoke', currentStep: 'revoke' });

        expect(screen.queryByTestId('@step-cards/finished')).not.toBeOnTheScreen();

        const nextStepCards = screen.getAllByTestId('@step-cards/next');
        expect(nextStepCards).toHaveLength(2);
        expect(nextStepCards[0]).toHaveTextContent(APPROVE_TITLE, { exact: false });
        expect(nextStepCards[1]).toHaveTextContent(SWAP_TITLE, { exact: false });
    });

    it('renders only the last finished step as a finished card', async () => {
        await renderLayout({ approvalStatus: 'needs_revoke', currentStep: 'preview' });

        expect(screen.getAllByTestId('@step-cards/finished')).toHaveLength(1);
        expect(screen.getByTestId('@step-cards/finished')).toHaveTextContent(APPROVE_TITLE, {
            exact: false,
        });
        expect(screen.queryByText(REVOKE_TITLE)).not.toBeOnTheScreen();
        expect(screen.queryByTestId('@step-cards/next')).not.toBeOnTheScreen();
    });

    it('renders the finished and next cards around the current step', async () => {
        await renderLayout({ approvalStatus: 'needs_revoke', currentStep: 'approval' });

        expect(screen.getByTestId('@step-cards/finished')).toHaveTextContent(REVOKE_TITLE, {
            exact: false,
        });
        expect(screen.getByTestId('@step-cards/next')).toHaveTextContent(SWAP_TITLE, {
            exact: false,
        });
    });
});
