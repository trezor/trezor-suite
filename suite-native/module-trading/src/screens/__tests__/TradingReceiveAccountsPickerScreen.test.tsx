import { RouteProp } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
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

    const renderScreen = async (preloadedState: PreloadedState) => {
        const result = await renderWithStoreProviderAsync(<TradingReceiveAccountsPickerScreen />, {
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

    it('should render account list with correct title', async () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = await renderScreen(getPreloadedState([]));

        expect(getByText('Select account')).toBeTruthy();
    });

    it('should render account list with accounts', async () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = await renderScreen(getPreloadedState(accounts));

        expect(getByText(accounts[0].accountLabel!)).toBeTruthy();
    });

    it('should render account list with accounts for exchange', async () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'exchange' };

        const { getByText } = await renderScreen(getPreloadedState(accounts));

        expect(getByText(accounts[0].accountLabel!)).toBeTruthy();
    });

    it('should render empty state when no account exist', async () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = await renderScreen(getPreloadedState([]));

        expect(getByText('Account not found')).toBeTruthy();
    });

    it('should render add account button', async () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = await renderScreen(getPreloadedState([]));

        expect(getByText('Add new')).toBeTruthy();
    });
});
