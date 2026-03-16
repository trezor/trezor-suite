import { type RouteProp } from '@react-navigation/native';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { type AccountKey } from '@suite-common/wallet-types';
import { type TradingStackParamList, type TradingStackRoutes } from '@suite-native/navigation';
import {
    type TestStore,
    fireEvent,
    initStore,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { TradingExchangeApprovalScreen } from '../TradingExchangeApprovalScreen';

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();
const mockConfirmApproval = jest.fn().mockResolvedValue({});

jest.mock('../../hooks/exchange/Approval/useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        quote: undefined,
        isConfirming: false,
        error: null,
        confirmApproval: mockConfirmApproval,
    }),
}));

jest.mock('../../hooks/exchange/Approval/useEvmApprovalFees', () => ({
    useEvmApprovalFees: () => ({
        fee: '100000',
        isLoading: false,
        error: null,
        composeFees: jest.fn(),
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
    let unmount: (() => void) | undefined;

    const renderScreen = async () => {
        const result = await renderWithStoreProviderAsync(
            <TradingExchangeApprovalScreen route={{ params: {} } as any} navigation={{} as any} />,
            { store },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        const preloadedState = {
            wallet: getWalletState({
                tradeType: 'exchange',
            }),
        };

        store = initStore(preloadedState).store;
        store.dispatch(tradingExchangeActions.savePreselectedQuote(testQuote));
        store.dispatch(
            tradingExchangeActions.setTradingAccountKey(
                'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
            ),
        );
    });

    afterEach(() => {
        if (unmount) {
            unmount();
            unmount = undefined;
        }
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

    it('should render nothing when no quote is provided', async () => {
        store.dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { toJSON } = await renderScreen();

        expect(toJSON()).toBeNull();
    });

    it('should clear selected quote on unmount', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        const { unmount: localUnmount } = await renderScreen();

        localUnmount();
        unmount = undefined;

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toBeUndefined();
    });
});
