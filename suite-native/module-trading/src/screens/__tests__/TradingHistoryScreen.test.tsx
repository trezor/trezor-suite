import { type RouteProp } from '@react-navigation/native';

import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import { fireEvent } from '@suite-native/test-utils-store';
import { accounts, getBuyTrade } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../__tests__/tradingTestUtils';
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

const overrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: '1@2:3',
            },
        },
    },
    wallet: {
        trading: {
            trades: [getBuyTrade({ status: 'SUBMITTED' })],
        },
        accounts,
    },
};

describe('TradingHistoryScreen', () => {
    let unmount: (() => void) | undefined;

    const renderScreen = () => {
        const result = renderWithTradingProvider(<TradingHistoryScreen />, { overrides });

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

    it('should render list of trades', () => {
        const { getByText } = renderScreen();

        expect(getByText('Mercuryo')).toBeTruthy();
        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
    });

    it('should show bottom sheet when trade item is clicked', () => {
        const { getByText, queryAllByText } = renderScreen();

        fireEvent.press(getByText('Trans. ID: d3ef3451-8f68-4250-9e08-580ece5e7d12'));

        expect(mockShowSheet).toHaveBeenCalledTimes(1);

        expect(getByText('You paid')).toBeTruthy();
        // one for history list and one for detail in sheet
        expect(queryAllByText('0.462586 ETH').length).toBe(2);
    });
});
