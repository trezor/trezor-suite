import { RouteProp } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { StaticSessionId } from '@trezor/connect';

import fixturesAccounts from '../../__fixtures__/accounts.json';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingReceiveAccountsPickerScreen } from '../TradingReceiveAccountsPickerScreen';

const accounts = fixturesAccounts as Account[];

let mockRouteParams: {
    symbol: NetworkSymbol;
} = { symbol: 'btc' };

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
                staticSessionId: 'staticSessionId' as StaticSessionId,
            },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: {
        accounts: preloadedAccounts,
        tradingNew: {
            ...getInitializedTradingState(),
        },
    },
});

const renderScreen = (preloadedState: PreloadedState) =>
    renderWithStoreProviderAsync(<TradingReceiveAccountsPickerScreen />, {
        preloadedState,
    });

describe('ReceiveAccountsPickerScreen', () => {
    it('should render account list with correct title', async () => {
        mockRouteParams = { symbol: 'btc' };

        const { getByText } = await renderScreen(getPreloadedState([]));

        expect(getByText('Select account')).toBeTruthy();
    });

    it('should render account list with accounts', async () => {
        mockRouteParams = { symbol: 'btc' };

        const { getByText } = await renderScreen(getPreloadedState(accounts));

        expect(getByText(accounts[0].accountLabel!)).toBeTruthy();
    });

    it('should render empty state when no account exist', async () => {
        mockRouteParams = { symbol: 'btc' };

        const { getByText } = await renderScreen(getPreloadedState([]));

        expect(getByText('Account not found')).toBeTruthy();
    });

    it('should render add account button', async () => {
        mockRouteParams = { symbol: 'btc' };

        const { getByText } = await renderScreen(getPreloadedState([]));

        expect(getByText('Add new')).toBeTruthy();
    });
});
