import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { TradingExchangeRevokeStep } from './TradingExchangeRevokeStep';
import { useExchangeRevokeStep } from '../../../hooks/exchange/Approval/useExchangeRevokeStep';
import {
    createTradingTestStore,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';
import { REVOKE_CONTINUE_BUTTON_TEST_ID } from '../Approval/ApprovalButton';

jest.mock('../../../hooks/exchange/Approval/useExchangeRevokeStep', () => ({
    useExchangeRevokeStep: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ key: 'TradingExchangeFlow', name: 'TradingExchangeFlow', params: {} }),
    useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
}));

const mockedUseExchangeRevokeStep = jest.mocked(useExchangeRevokeStep);

describe('TradingExchangeRevokeStep', () => {
    let store: Store<TradingRootState>;

    const mockRevokeStep = (overrides: Partial<ReturnType<typeof useExchangeRevokeStep>> = {}) => {
        mockedUseExchangeRevokeStep.mockReturnValue({
            quote: mercuryoFixedWorstQuote,
            coinSymbol: 'USDT',
            isRevokeReady: true,
            isDisabled: false,
            ...overrides,
        });
    };

    const renderStep = () =>
        renderWithTradingProvider(<TradingExchangeRevokeStep approvalStatus="needs_revoke" />, {
            services: { store, networks: mockNetworksServices() },
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockRevokeStep();

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    it('renders the revoke as the first step with the approval and swap as next steps', async () => {
        await renderStep();

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeRevokeScreen.revokeTitle', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert'),
            ),
        ).toBeOnTheScreen();
        expect(screen.getByText('ETH Account #1')).toBeOnTheScreen();
        expect(screen.queryByTestId('@step-cards/finished')).not.toBeOnTheScreen();

        const nextStepCards = screen.getAllByTestId('@step-cards/next');
        expect(nextStepCards).toHaveLength(2);
        expect(nextStepCards[0]).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.approve'),
            { exact: false },
        );
        expect(nextStepCards[1]).toHaveTextContent(
            getTranslation('moduleTrading.tradingExchangeFlowScreen.stepTitles.swap'),
            { exact: false },
        );
    });

    it('renders the revoke continue button in the footer', async () => {
        await renderStep();

        expect(screen.getByTestId(REVOKE_CONTINUE_BUTTON_TEST_ID)).toBeEnabled();
    });

    it('renders a disabled continue button when the revoke cannot proceed', async () => {
        mockRevokeStep({ isDisabled: true });

        await renderStep();

        expect(screen.getByText(getTranslation('generic.buttons.continue'))).toBeDisabled();
    });

    it('renders the error alert without the steps when there is no quote', async () => {
        mockRevokeStep({ quote: undefined });

        await renderStep();

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert'),
            ),
        ).toBeOnTheScreen();
        expect(screen.queryByTestId('@step-cards/current')).not.toBeOnTheScreen();
    });
});
