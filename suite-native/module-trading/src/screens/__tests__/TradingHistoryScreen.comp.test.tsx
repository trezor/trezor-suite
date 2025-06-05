import { RouteProp } from '@react-navigation/native';

import { Account } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { StaticSessionId } from '@trezor/connect';

import fixturesAccounts from '../../__fixtures__/accounts.json';
import { getBuyTrade } from '../../__fixtures__/trades';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingHistoryScreen } from '../TradingHistoryScreen';

const mockShowSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

jest.mock('../../hooks/general/useBottomSheetControls', () => ({
    useBottomSheetControls: () => ({
        showSheet: mockShowSheet,
    }),
}));

jest.mock('@suite-common/trading', () => {
    const actualImplementation = jest.requireActual('@suite-common/trading');

    return {
        ...actualImplementation,
        tradingThunks: {
            ...actualImplementation.tradingThunks,
            watchTradeThunk: () => ({ type: 'mocked-action' }),
        },
    };
});

const getPreloadedState = (): PreloadedState => ({
    wallet: {
        tradingNew: {
            ...getInitializedTradingState(),
            trades: [getBuyTrade({ status: 'SUBMITTED' })],
        },
        accounts: fixturesAccounts as Account[],
    },
    device: {
        selectedDevice: {
            state: {
                staticSessionId: 'staticSessionId' as StaticSessionId,
            },
        },
    },
});

const renderScreen = (preloadedState: PreloadedState) =>
    renderWithStoreProviderAsync(<TradingHistoryScreen />, {
        preloadedState,
    });

describe('TradingHistoryScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render list of trades', async () => {
        const { getByText } = await renderScreen(getPreloadedState());

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
    });

    it('should show bottom sheet when trade item is clicked', async () => {
        const { getByText, queryAllByText } = await renderScreen(getPreloadedState());

        fireEvent.press(getByText('Trans. ID: d3ef3451-8f68-4250-9e08-580ece5e7d12'));

        expect(mockShowSheet).toHaveBeenCalledTimes(1);

        expect(getByText('You paid')).toBeTruthy();
        // one for history list and one for detail in sheet
        expect(queryAllByText('0.462586 ETH').length).toBe(2);
    });
});
