import { type RouteProp } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { type RootStackParamList, type RootStackRoutes } from '@suite-native/navigation';
import { accounts } from '@suite-native/trading-fixtures';

import { TradingReceiveAccountsPickerScreen } from './TradingReceiveAccountsPickerScreen';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../test-utils/tradingTestUtils';

let mockRouteParams: {
    symbol: NetworkSymbol;
    tradingType: 'exchange' | 'buy';
} = { symbol: 'btc', tradingType: 'buy' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: { ...mockRouteParams },
        }) as RouteProp<RootStackParamList, RootStackRoutes.ReceiveAccounts>,
}));

const overridesWithAccounts = (
    preloadedAccounts: Account[],
): PreloadedStatePartial<TradingTestPreloadedState> => ({
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
    },
});

describe('TradingReceiveAccountsPickerScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = (overrides: PreloadedStatePartial<TradingTestPreloadedState>) => {
        const result = renderWithTradingProvider(<TradingReceiveAccountsPickerScreen />, {
            tradeType: mockRouteParams.tradingType,
            overrides,
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

    it('should render the empty-state title when no account exists', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(overridesWithAccounts([]));

        expect(
            getByText(getTranslation('moduleTrading.accountScreen.accountEmpty.title')),
        ).toBeTruthy();
    });

    it('should render account list with accounts', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(overridesWithAccounts(accounts));

        expect(getByText(accounts[0]?.accountLabel ?? '')).toBeTruthy();
    });

    it('should render account list with accounts for exchange', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'exchange' };

        const { getByText } = renderScreen(overridesWithAccounts(accounts));

        expect(getByText(accounts[0]?.accountLabel ?? '')).toBeTruthy();
    });

    it('should render empty state when no account exist', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(overridesWithAccounts([]));

        expect(
            getByText(getTranslation('moduleTrading.accountScreen.accountEmpty.title')),
        ).toBeTruthy();
    });

    it('should render the activation button when no account exists', () => {
        mockRouteParams = { symbol: 'btc', tradingType: 'buy' };

        const { getByText } = renderScreen(overridesWithAccounts([]));

        expect(
            getByText(
                getTranslation('moduleTrading.accountScreen.accountEmpty.activate', {
                    network: 'Bitcoin',
                }),
            ),
        ).toBeTruthy();
    });
});
