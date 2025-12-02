import { EventType, analytics } from '@suite-native/analytics';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { accounts, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { TradingFeesScreen } from '../TradingFeesScreen';

// Mock the useSubscribeForSolanaBlockUpdates hook
const mockUseSubscribeForSolanaBlockUpdates = jest.fn();
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useSubscribeForSolanaBlockUpdates: () => mockUseSubscribeForSolanaBlockUpdates(),
}));

// Mock the TradingFeesForm component
const mockTradingFeesForm = jest.fn();
jest.mock('../../components/fees/TradingFeesForm', () => ({
    TradingFeesForm: (props: any) => {
        mockTradingFeesForm(props);

        return <div data-testid="trading-fees-form" />;
    },
}));

const mockUseRoute = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => mockUseRoute(),
}));

const preloadedState = {
    wallet: {
        trading: getInitializedTradingState('exchange'),
        accounts,
    },
};

const renderScreen = () =>
    renderWithStoreProviderAsync(<TradingFeesScreen />, {
        preloadedState,
    });

describe('TradingFeesScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock return value
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: 'btc1' },
        });
    });

    it('should render the screen without crashing', async () => {
        const { root } = await renderScreen();

        // The screen should render without crashing
        expect(root).toBeTruthy();
    });

    it('should render TradingFeesForm with correct accountKey', async () => {
        await renderScreen();

        expect(mockTradingFeesForm).toHaveBeenCalledWith({
            accountKey: 'btc1',
        });
    });

    it('should call useSubscribeForSolanaBlockUpdates with the account', async () => {
        await renderScreen();

        expect(mockUseSubscribeForSolanaBlockUpdates).toHaveBeenCalled();
    });

    it('should not render anything when account is not found', async () => {
        // Mock useRoute to return a non-existent account key
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: 'nonexistent-account' },
        });

        const { queryByTestId } = await renderScreen();

        // Should not render the TradingFeesForm when account is not found
        expect(queryByTestId('trading-fees-form')).not.toBeOnTheScreen();
        expect(mockTradingFeesForm).not.toHaveBeenCalled();
    });

    it('should report to analytics on mount for exchange (default)', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');

        await renderScreen();

        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: expect.objectContaining({
                step: 'fee-selection',
                action: 'visit',
            }),
        });
    });

    it('should report to analytics on mount for exchange when explicitly set', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: 'btc1', tradingType: 'exchange' },
        });

        await renderScreen();

        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingExchange,
            payload: expect.objectContaining({
                step: 'fee-selection',
                action: 'visit',
            }),
        });
    });

    it('should report to analytics on mount for sell', async () => {
        const analyticsSpy = jest.spyOn(analytics, 'report');
        const sellPreloadedState = {
            wallet: {
                trading: getInitializedTradingState('sell'),
                accounts,
            },
        };
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: 'btc1', tradingType: 'sell' },
        });

        await renderWithStoreProviderAsync(<TradingFeesScreen />, {
            preloadedState: sellPreloadedState,
        });

        expect(analyticsSpy).toHaveBeenCalledWith({
            type: EventType.TradingSell,
            payload: expect.objectContaining({
                step: 'fee-selection',
                action: 'visit',
            }),
        });
    });
});
