import { RouteProp } from '@react-navigation/native';

import { Account } from '@suite-common/wallet-types';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import fixturesAccounts from '../../__fixtures__/accounts.json';
import { exchangeQuotes } from '../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { TradingExchangeApprovalScreen } from '../TradingExchangeApprovalScreen';

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            params: undefined,
        }) as RouteProp<TradingStackParamList, TradingStackRoutes.TradingHistory>,
}));

jest.mock('../../hooks/general/useBottomSheetControls', () => ({
    useBottomSheetControls: () => ({
        isSheetVisible: false,
        showSheet: mockShowSheet,
        hideSheet: mockHideSheet,
    }),
}));

const accounts = fixturesAccounts as Account[];
const testQuote = exchangeQuotes[0];

const preloadedState = {
    wallet: {
        trading: {
            ...getInitializedTradingState('exchange'),
            exchange: {
                ...getInitializedTradingState('exchange').exchange,
                selectedQuote: testQuote,
                tradingAccountKey: accounts[0].key,
            },
        },
        accounts,
    },
};

const renderScreen = () =>
    renderWithStoreProviderAsync(<TradingExchangeApprovalScreen />, {
        preloadedState,
    });

describe('TradingExchangeApprovalScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the approval screen with quote details', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText('$4.76')).toBeOnTheScreen(); // Fixed fee TODO value
    });

    it('should show network information when network symbol is available', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Ethereum')).toBeOnTheScreen();
    });

    it('should display provider information correctly', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should open bottom sheet when limit row is pressed', async () => {
        const { findByText } = await renderScreen();

        const pressableElement = await findByText('Limit');

        fireEvent.press(pressableElement);
        expect(mockShowSheet).toHaveBeenCalledTimes(1);
    });

    it('should render continue button', async () => {
        const { getByText } = await renderScreen();

        const buttons = getByText('Continue');
        expect(buttons).toBeTruthy();
    });
});
