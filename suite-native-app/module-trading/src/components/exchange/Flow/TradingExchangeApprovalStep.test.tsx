import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { type ExchangeFlowApprovalStatus } from '@suite-native/navigation';
import { screen } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { TradingExchangeApprovalStep } from './TradingExchangeApprovalStep';
import { useExchangeApprovalStep } from '../../../hooks/exchange/Approval/useExchangeApprovalStep';
import {
    createTradingTestStore,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

jest.mock('../../../hooks/exchange/Approval/useExchangeApprovalStep', () => ({
    useExchangeApprovalStep: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ key: 'TradingExchangeFlow', name: 'TradingExchangeFlow', params: {} }),
    useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
}));

const mockedUseExchangeApprovalStep = jest.mocked(useExchangeApprovalStep);

const APPROVE_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.title');
const INCREASE_TITLE = getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.title');

describe('TradingExchangeApprovalStep', () => {
    let store: Store<TradingRootState>;

    const mockApprovalStep = (
        overrides: Partial<ReturnType<typeof useExchangeApprovalStep>> = {},
    ) => {
        mockedUseExchangeApprovalStep.mockReturnValue({
            quote: mercuryoFixedWorstQuote,
            coinSymbol: 'USDT',
            isApprovalReady: true,
            isDisabled: false,
            onApprovalTypeChange: jest.fn(),
            ...overrides,
        });
    };

    const renderStep = (approvalStatus: ExchangeFlowApprovalStatus) =>
        renderWithTradingProvider(<TradingExchangeApprovalStep approvalStatus={approvalStatus} />, {
            services: { store, networks: mockNetworksServices() },
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockApprovalStep();

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    it('renders the basic approval as the first step with the swap as the next step', async () => {
        await renderStep('needs_approval');

        expect(screen.getByText(APPROVE_TITLE)).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
        expect(screen.queryByText(INCREASE_TITLE)).not.toBeOnTheScreen();
        expect(screen.queryByTestId('@step-cards/finished')).not.toBeOnTheScreen();
        expect(screen.getByTestId('@step-cards/next')).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.swap'),
            { exact: false },
        );
        expect(mockedUseExchangeApprovalStep).toHaveBeenCalledWith({ isRevoked: false });
    });

    it('renders the increase header when increasing a pre-approved amount', async () => {
        await renderStep('needs_increase');

        expect(screen.getByText(INCREASE_TITLE)).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
        expect(screen.queryByText(APPROVE_TITLE)).not.toBeOnTheScreen();
        expect(screen.queryByTestId('@step-cards/finished')).not.toBeOnTheScreen();
    });

    it('renders the revoke as the finished step after a revoke', async () => {
        await renderStep('needs_revoke');

        expect(screen.getByText(APPROVE_TITLE)).toBeOnTheScreen();
        expect(screen.queryByText(INCREASE_TITLE)).not.toBeOnTheScreen();
        expect(screen.getByTestId('@step-cards/finished')).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.revoke'),
            { exact: false },
        );
        expect(mockedUseExchangeApprovalStep).toHaveBeenCalledWith({ isRevoked: true });
    });

    it('renders a disabled continue button in the footer', async () => {
        mockApprovalStep({ isDisabled: true });

        await renderStep('needs_approval');

        expect(screen.getByText(getTranslation('generic.buttons.continue'))).toBeDisabled();
    });

    it('renders the error alert without the steps when there is no quote', async () => {
        mockApprovalStep({ quote: undefined });

        await renderStep('needs_approval');

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert'),
            ),
        ).toBeOnTheScreen();
        expect(screen.queryByTestId('@step-cards/current')).not.toBeOnTheScreen();
        expect(screen.queryByText(getTranslation('generic.buttons.continue'))).toBeNull();
    });
});
