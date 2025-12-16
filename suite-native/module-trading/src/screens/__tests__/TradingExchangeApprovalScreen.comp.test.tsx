import { RouteProp } from '@react-navigation/native';

import {
    selectTradingExchangePreselectedQuote,
    tradingExchangeActions,
} from '@suite-common/trading';
import { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import {
    TestStore,
    fireEvent,
    initStore,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { TradingExchangeApprovalScreen } from '../TradingExchangeApprovalScreen';

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();

jest.mock('../../hooks/exchange/useExchangeFlow', () => ({
    useExchangeFlow: () => ({
        confirmTrade: jest.fn().mockResolvedValue(true),
        fetchFeesAndCompose: jest.fn(),
    }),
}));

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
        isSheetVisible: false,
        showSheet: mockShowSheet,
        hideSheet: mockHideSheet,
    }),
}));

const testQuote = exchangeQuotes[0];

describe('TradingExchangeApprovalScreen', () => {
    let store: TestStore;

    const renderScreen = () =>
        renderWithStoreProviderAsync(
            <TradingExchangeApprovalScreen route={{ params: {} } as any} navigation={{} as any} />,
            { store },
        );

    beforeEach(() => {
        jest.clearAllMocks();

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        store = initStore(preloadedState).store;
        store.dispatch(tradingExchangeActions.savePreselectedQuote(testQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey('eth-account-1'));
    });

    it('should render the approval screen with quote details', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
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

    it('should render nothing when no preselected quote is provided', async () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));

        const { toJSON } = await renderScreen();

        expect(toJSON()).toBeNull();
    });

    it('should clear preselected quote on unmount', async () => {
        const { unmount } = await renderScreen();

        unmount();

        const preselectedQuote = selectTradingExchangePreselectedQuote(store.getState());
        expect(preselectedQuote).toBeUndefined();
    });
});
