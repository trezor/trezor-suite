import { RouteProp } from '@react-navigation/native';

import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { fireEvent } from '@suite-native/test-utils';
import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { accounts, getBuyTrade, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { TradingHistoryScreen } from '../TradingHistoryScreen';

const mockShowSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

jest.mock('@suite-native/trading-atoms', () => ({
    ...jest.requireActual('@suite-native/trading-atoms'),
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
        trading: {
            ...getInitializedTradingState(),
            trades: [getBuyTrade({ status: 'SUBMITTED' })],
        },
        accounts,
    },
    device: {
        selectedDevice: {
            state: {
                staticSessionId: '1@2:3',
            },
        },
    },
});

describe('TradingHistoryScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = async (preloadedState: PreloadedState) => {
        const result = await renderWithStoreProviderAsync(<TradingHistoryScreen />, {
            preloadedState,
        });

        ({ unmount } = result);

        return result;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
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
