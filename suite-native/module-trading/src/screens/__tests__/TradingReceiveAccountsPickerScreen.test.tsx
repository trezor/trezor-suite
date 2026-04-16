import { type RouteProp } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { accounts, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { TradingReceiveAccountsPickerScreen } from '../TradingReceiveAccountsPickerScreen';

let mockRouteParams: {
    symbol: NetworkSymbol;
    tradingType: 'exchange' | 'buy';
} = { symbol: 'btc', tradingType: 'buy' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: { ...mockRouteParams },
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.ReceiveAccounts>,
}));

const getPreloadedState = (preloadedAccounts: Account[]): PreloadedState => ({
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: '1@2:3',
            },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: {
        accounts: preloadedAccounts,
        trading: {
            ...getInitializedTradingState(),
        },
    },
});

describe('TradingReceiveAccountsPickerScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = (preloadedState: PreloadedState) => {
        const result = renderWithStoreProvider(<TradingReceiveAccountsPickerScreen />, {
            preloadedState,
        });

        ({ unmount } = result);

        return result;
    };

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
    });

    it('should render account list with correct title', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(getPreloadedState([]));

        expect(getByText('Select account')).toBeTruthy();
    });

    it('should render account list with accounts', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(getPreloadedState(accounts));

        expect(getByText(accounts[0]?.accountLabel ?? '')).toBeTruthy();
    });

    it('should render account list with accounts for exchange', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'exchange' };

        const { getByText } = renderScreen(getPreloadedState(accounts));

        expect(getByText(accounts[0]?.accountLabel ?? '')).toBeTruthy();
    });

    it('should render empty state when no account exist', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(getPreloadedState([]));

        expect(getByText('Account not found')).toBeTruthy();
    });

    it('should render add account button', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(getPreloadedState([]));

        expect(getByText('Add new')).toBeTruthy();
    });
});
