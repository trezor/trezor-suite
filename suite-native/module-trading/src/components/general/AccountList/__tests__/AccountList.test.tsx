import { useNavigation } from '@react-navigation/native';
import { combineReducers } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { initialSuiteSyncDataState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { selectTradingBuyReceiveAccountKey } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accounts,
    btc1NormalAccount,
} from '@suite-native/trading-fixtures';
import {
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
    tradingInitialState,
    tradingSlice,
} from '@suite-native/trading-state';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { type Address } from '@trezor/blockchain-link-types';

import { AccountList, type AccountsListProps, keyExtractor } from '../AccountList';

const defaultPreloadedState = {
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID,
            },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: { accounts },
};

const getStateMockupBuy = (selectedAccount: ReceiveAccount) => ({
    ...defaultPreloadedState,
    wallet: {
        accounts: defaultPreloadedState.wallet.accounts,
        trading: {
            ...tradingInitialState,
            buy: {
                ...tradingInitialState.buy,
                receiveAddress: selectedAccount?.address?.address,
                tradingAccountKey: selectedAccount.account.key,
            },
        },
    },
});

const getStateMockupExchange = (selectedAccount: ReceiveAccount) => ({
    ...defaultPreloadedState,
    wallet: {
        accounts: defaultPreloadedState.wallet.accounts,
        trading: {
            ...tradingInitialState,
            exchange: {
                ...tradingInitialState.exchange,
                receiveAddress: selectedAccount?.address?.address,
                receiveAccountKey: selectedAccount.account.key,
            },
        },
    },
});

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(),
}));

describe('AccountList', () => {
    const onSetPickerModeMock = jest.fn();
    const popToTop = jest.fn();

    let store: TestStore;

    const createTestStore = (preloadedState = defaultPreloadedState) =>
        createLightStore({
            reducer: {
                locale: localeReducer,
                device: createStaticReducer(preloadedState.device),
                messageSystem: createStaticReducer(messageSystemInitialState),
                suiteSync: createStaticReducer(initialSuiteSyncState),
                suiteSyncData: createStaticReducer(initialSuiteSyncDataState),
                wallet: combineReducers({
                    accounts: createStaticReducer(preloadedState.wallet.accounts),
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
                }),
            },
            preloadedState,
        });

    const renderComponent = (
        props: Partial<AccountsListProps>,
        preloadedState = defaultPreloadedState,
    ) => {
        store = createTestStore(preloadedState);

        return renderWithStoreProvider(
            <AccountList
                symbol="btc"
                pickerMode="account"
                tradingType="buy"
                onAddAccountTap={jest.fn()}
                onSetPickerMode={jest.fn()}
                {...props}
            />,
            { store },
        );
    };

    describe('renderItem', () => {
        afterEach(() => {
            screen.unmount();
        });

        it('should display all accounts for given symbol', () => {
            const { getByText } = renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
            });

            expect(getByText('BTC Account #1')).toBeTruthy();
            expect(getByText('BTC Account #2')).toBeTruthy();
        });

        it('should display addresses when picker mode is set and account is selected', () => {
            const { getByText } = renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                },
                getStateMockupBuy({ account: btc1NormalAccount }),
            );

            const item = getByText('UNUSED1');
            expect(item).toBeTruthy();
        });
    });

    describe('onItemSelect', () => {
        afterEach(() => {
            screen.unmount();
        });

        it('should call onSetPickerMode when account is selected in account mode', () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });

            const { getByText } = renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
                onSetPickerMode: onSetPickerModeMock,
            });

            const item = getByText('BTC Account #1');
            expect(item).toBeTruthy();

            fireEvent.press(item);

            expect(onSetPickerModeMock).toHaveBeenCalledWith('address');
            expect(popToTop).not.toHaveBeenCalled();
        });

        it('should popToTop when account is selected in account mode and there are no addresses', () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });

            const { getByText } = renderComponent({
                symbol: 'eth',
                pickerMode: 'account',
                onSetPickerMode: onSetPickerModeMock,
            });

            const item = getByText('ETH Account #1');
            expect(item).toBeTruthy();

            fireEvent.press(item);

            expect(popToTop).toHaveBeenCalled();
        });

        it('should handle address selection in address mode', () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });
            const { getByText } = renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                    onSetPickerMode: onSetPickerModeMock,
                },
                getStateMockupBuy({ account: btc1NormalAccount }),
            );

            const item = getByText('UNUSED1');
            expect(item).toBeTruthy();

            fireEvent.press(item);

            expect(popToTop).toHaveBeenCalled();
        });

        it('should set correct state with tradingType set to "buy"', () => {
            const { getByText } = renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
            });

            fireEvent.press(getByText('BTC Account #1'));

            expect(selectBuySelectedReceiveAccount(store.getState())).toEqual({
                account: btc1NormalAccount,
                address: undefined,
            });
            expect(selectTradingBuyReceiveAccountKey(store.getState())).toBe(btc1NormalAccount.key);
        });

        it('should set correct state with tradingType set to "exchange"', () => {
            const { getByText } = renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
                tradingType: 'exchange',
            });

            fireEvent.press(getByText('BTC Account #1'));

            expect(selectExchangeSelectedReceiveAccount(store.getState())).toEqual({
                account: btc1NormalAccount,
                address: undefined,
            });
        });

        it('should handle address selection in address mode for "exchange"', () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });
            const { getByText } = renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                    onSetPickerMode: onSetPickerModeMock,
                    tradingType: 'exchange',
                },
                getStateMockupExchange({ account: btc1NormalAccount }),
            );

            const item = getByText('UNUSED1');
            expect(item).toBeTruthy();

            fireEvent.press(item);

            expect(popToTop).toHaveBeenCalled();
        });
    });

    describe('footer', () => {
        afterEach(() => {
            screen.unmount();
        });

        it('should display footer with "Add new" button in "account" mode', () => {
            const { getByText } = renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
            });

            expect(getByText('Add new')).toBeTruthy();
        });

        it('should NOT display footer with "Add new" button in "address" mode', () => {
            const { queryByText } = renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                },
                getStateMockupBuy({ account: btc1NormalAccount }),
            );

            expect(queryByText('Add new')).toBeNull();
        });
    });

    describe('keyExtractor', () => {
        it('should use default string for undefined address', () => {
            expect(keyExtractor({ account: btc1NormalAccount, address: undefined })).toBe(
                btc1NormalAccount.key + '_address_undefined',
            );
        });

        it('should use address string for set address', () => {
            expect(
                keyExtractor({
                    account: btc1NormalAccount,
                    address: { address: 'ADDRESS1' } as Address,
                }),
            ).toBe(btc1NormalAccount.key + '_ADDRESS1');
        });
    });
});
