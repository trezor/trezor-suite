import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { renderWithStoreProvider } from '@suite-native/test-utils';
import {
    accounts,
    btc1NormalAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';

import { TradingFeesScreen } from '../TradingFeesScreen';

// Mock analytics hook
jest.mock('@suite-native/services', () => {
    const original = jest.requireActual('@suite-native/services');

    return {
        ...original,
        useAnalytics: jest.fn(),
    };
});

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

describe('TradingFeesScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = (state = preloadedState) => {
        const reportMock = jest.fn();
        jest.clearAllMocks();

        (useAnalytics as jest.Mock).mockReturnValue({
            report: reportMock,
        });

        const result = renderWithStoreProvider(<TradingFeesScreen />, {
            preloadedState: state,
        });

        ({ unmount } = result);

        return { result, reportMock };
    };

    beforeEach(() => {
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: btc1NormalAccount.key },
        });
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render the screen without crashing', () => {
        const { result } = renderScreen();

        expect(result.root).toBeTruthy();
    });

    it('should render TradingFeesForm with correct accountKey', () => {
        renderScreen();

        expect(mockTradingFeesForm).toHaveBeenCalledWith({
            accountKey: btc1NormalAccount.key,
        });
    });

    it('should call useSubscribeForSolanaBlockUpdates with the account', () => {
        renderScreen();

        expect(mockUseSubscribeForSolanaBlockUpdates).toHaveBeenCalled();
    });

    it('should not render anything when account is not found', () => {
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: 'nonexistent-account' },
        });

        const { result } = renderScreen();

        expect(result.queryByTestId('trading-fees-form')).not.toBeOnTheScreen();
        expect(mockTradingFeesForm).not.toHaveBeenCalled();
    });

    it('should report to analytics on mount for exchange (default)', () => {
        const { reportMock } = renderScreen();

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'fee-selection',
                action: 'visit',
            }),
        });
    });

    it('should report to analytics on mount for exchange when explicitly set', () => {
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: btc1NormalAccount.key, tradingType: 'exchange' },
        });

        const { reportMock } = renderScreen();

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingExchangeEvent.name,
            payload: expect.objectContaining({
                step: 'fee-selection',
                action: 'visit',
            }),
        });
    });

    it('should report to analytics on mount for sell', () => {
        const sellPreloadedState = {
            wallet: {
                trading: getInitializedTradingState('sell'),
                accounts,
            },
        };
        mockUseRoute.mockReturnValue({
            name: 'TradingFeesScreen',
            params: { accountKey: btc1NormalAccount.key, tradingType: 'sell' },
        });

        const { reportMock } = renderScreen(sellPreloadedState);

        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingSellEvent.name,
            payload: expect.objectContaining({
                step: 'fee-selection',
                action: 'visit',
            }),
        });
    });
});
