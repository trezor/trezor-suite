import { type RouteProp, useNavigation } from '@react-navigation/native';

import { tradingBuyActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import type { RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import { fireEvent, renderWithStoreProvider, waitFor } from '@suite-native/test-utils-store';
import { MOCK_ACCOUNT_DEVICE_SESSION_ID, btc1NormalAccount } from '@suite-native/trading-fixtures';
import {
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
} from '@suite-native/trading-state';

import { TradingReceiveAddressPickerScreen } from './TradingReceiveAddressPickerScreen';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingLightStore,
} from '../test-utils/tradingTestUtils';

const navigationPopToTop = jest.fn();
const navigationGoBack = jest.fn();
let mockRouteParams: RootStackParamList[RootStackRoutes.TradingReceiveAddress] = {
    accountKey: btc1NormalAccount.key,
    tradingType: 'buy',
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(),
    useRoute: () =>
        ({
            params: mockRouteParams,
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingReceiveAddress>,
}));

describe(TradingReceiveAddressPickerScreen.name, () => {
    const overrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        device: {
            devices: [],
            selectedDevice: {
                state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
                connected: true,
                available: true,
                remember: true,
            },
        },
        wallet: { accounts: [btc1NormalAccount] },
    };

    const renderScreen = () => {
        const store = createTradingLightStore({
            tradeType: mockRouteParams.tradingType,
            overrides,
        });
        const result = renderWithStoreProvider(<TradingReceiveAddressPickerScreen />, { store });

        return { ...result, store };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useNavigation as jest.Mock).mockReturnValue({
            canGoBack: () => true,
            goBack: navigationGoBack,
            popToTop: navigationPopToTop,
        });
        mockRouteParams = { accountKey: btc1NormalAccount.key, tradingType: 'buy' };
    });

    it('renders the compact title, search input, and address sections', () => {
        const { getByPlaceholderText, getByText } = renderScreen();

        expect(
            getByText(getTranslation('moduleTrading.accountScreen.receiveAddressTitle')),
        ).toBeTruthy();
        expect(
            getByPlaceholderText(getTranslation('moduleTrading.accountScreen.searchPlaceholder')),
        ).toBeTruthy();
        expect(getByText(getTranslation('moduleTrading.accountScreen.newAddress'))).toBeTruthy();
        expect(getByText(getTranslation('moduleTrading.accountScreen.usedAddresses'))).toBeTruthy();
    });

    it('filters addresses and renders the no-results state', async () => {
        const { getByPlaceholderText, getByText, queryByText } = renderScreen();
        const searchInput = getByPlaceholderText(
            getTranslation('moduleTrading.accountScreen.searchPlaceholder'),
        );

        fireEvent.changeText(searchInput, 'USED1');

        await waitFor(() => {
            expect(getByText('USED1')).toBeTruthy();
            expect(queryByText('USED2')).toBeNull();
        });

        fireEvent.changeText(searchInput, 'missing');

        await waitFor(() => {
            expect(
                getByText(getTranslation('moduleTrading.accountScreen.addressEmpty.title')),
            ).toBeTruthy();
        });
    });

    it('atomically selects a buy account and address', () => {
        const { getByText, store } = renderScreen();

        fireEvent.press(getByText('UNUSED1'));

        expect(selectBuySelectedReceiveAccount(store.getState())).toEqual({
            account: btc1NormalAccount,
            address: btc1NormalAccount.addresses?.unused[0],
        });
        expect(navigationPopToTop).toHaveBeenCalledTimes(1);
    });

    it('atomically selects an exchange account and address', () => {
        mockRouteParams = { accountKey: btc1NormalAccount.key, tradingType: 'exchange' };
        const { getByText, store } = renderScreen();

        fireEvent.press(getByText('USED1'));

        expect(selectExchangeSelectedReceiveAccount(store.getState())).toEqual({
            account: btc1NormalAccount,
            address: btc1NormalAccount.addresses?.used[0],
        });
        expect(navigationPopToTop).toHaveBeenCalledTimes(1);
    });

    it('preserves the previous selection when navigating back', () => {
        const { getByTestId, store } = renderScreen();
        const previousAddress = btc1NormalAccount.addresses?.used[1];

        store.dispatch(tradingBuyActions.setTradingAccountKey(btc1NormalAccount.key));
        store.dispatch(tradingBuyActions.setReceiveAccountKey(btc1NormalAccount.key));
        store.dispatch(tradingBuyActions.setReceiveAddress(previousAddress?.address));

        fireEvent.press(getByTestId('@screen/sub-header/go-back-button'));

        expect(selectBuySelectedReceiveAccount(store.getState())).toEqual({
            account: btc1NormalAccount,
            address: previousAddress,
        });
        expect(navigationGoBack).toHaveBeenCalledTimes(1);
    });
});
