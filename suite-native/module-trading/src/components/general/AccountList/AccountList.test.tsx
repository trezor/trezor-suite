import { useNavigation } from '@react-navigation/native';

import { getTranslation } from '@suite-native/intl';
import { RootStackRoutes } from '@suite-native/navigation';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accounts,
    btc1NormalAccount,
    eth1NormalAccount,
} from '@suite-native/trading-fixtures';
import {
    selectBuySelectedReceiveAccount,
    selectExchangeSelectedReceiveAccount,
} from '@suite-native/trading-state';

import { AccountList, type AccountsListProps, keyExtractor } from './AccountList';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingLightStore,
} from '../../../test-utils/tradingTestUtils';

const navigationNavigate = jest.fn();
const navigationPopToTop = jest.fn();

const defaultOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
    device: {
        devices: [],
        selectedDevice: {
            state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: { accounts },
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(),
}));

describe('AccountList', () => {
    const renderAccountList = async (
        props: Partial<AccountsListProps> = {},
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) => {
        const store = createTradingLightStore({ overrides });
        const symbol = props.symbol ?? 'btc';
        const receiveAccounts = store
            .getState()
            .wallet.accounts.filter(account => account.symbol === symbol)
            .map(account => ({ account }));
        const data: AccountsListProps['data'] =
            receiveAccounts.length === 0
                ? []
                : [{ key: '', label: '', data: receiveAccounts, sectionData: undefined }];
        const result = await renderWithStoreProvider(
            <AccountList
                symbol={symbol}
                tradingType="buy"
                onAddAccountTap={jest.fn()}
                {...props}
                data={props.data ?? data}
            />,
            { store },
        );

        return { ...result, store };
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useNavigation as jest.Mock).mockReturnValue({
            navigate: navigationNavigate,
            popToTop: navigationPopToTop,
        });
    });

    it('displays all accounts for the selected network', async () => {
        const { getByText } = await renderAccountList();

        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(getByText('BTC Account #2')).toBeTruthy();
    });

    it('opens the address picker without changing trading state for an address-based account', async () => {
        const { getByText, store } = await renderAccountList();

        await fireEvent.press(getByText('BTC Account #1'));

        expect(navigationNavigate).toHaveBeenCalledWith(RootStackRoutes.TradingReceiveAddress, {
            accountKey: btc1NormalAccount.key,
            tradingType: 'buy',
        });
        expect(selectBuySelectedReceiveAccount(store.getState())).toBeUndefined();
        expect(navigationPopToTop).not.toHaveBeenCalled();
    });

    it('selects an account-based buy account and closes the picker', async () => {
        const { getByText, store } = await renderAccountList({ symbol: 'eth' });

        await fireEvent.press(getByText('ETH Account #1'));

        expect(selectBuySelectedReceiveAccount(store.getState())).toEqual({
            account: eth1NormalAccount,
        });
        expect(navigationPopToTop).toHaveBeenCalledTimes(1);
    });

    it('selects an account-based exchange account and closes the picker', async () => {
        const { getByText, store } = await renderAccountList({
            symbol: 'eth',
            tradingType: 'exchange',
        });

        await fireEvent.press(getByText('ETH Account #1'));

        expect(selectExchangeSelectedReceiveAccount(store.getState())).toEqual({
            account: eth1NormalAccount,
        });
        expect(navigationPopToTop).toHaveBeenCalledTimes(1);
    });

    it('renders the separate add account button for a populated list', async () => {
        const onAddAccountTap = jest.fn();
        const { getByText } = await renderAccountList({ onAddAccountTap });

        await fireEvent.press(
            getByText(getTranslation('moduleAddAccounts.coinDiscoveryFinishedScreen.addButton')),
        );

        expect(onAddAccountTap).toHaveBeenCalledTimes(1);
    });

    it('renders the redesigned empty state when no account exists', async () => {
        const { getByText } = await renderAccountList(
            {},
            {
                ...defaultOverrides,
                wallet: { accounts: [] },
            },
        );

        expect(
            getByText(getTranslation('moduleTrading.accountScreen.accountEmpty.title')),
        ).toBeTruthy();
    });

    it('extracts stable account and address keys', () => {
        const usedAddress = btc1NormalAccount.addresses?.used[0];

        expect(keyExtractor({ account: btc1NormalAccount, address: undefined })).toBe(
            `${btc1NormalAccount.key}_address_undefined`,
        );
        expect(keyExtractor({ account: btc1NormalAccount, address: usedAddress })).toBe(
            `${btc1NormalAccount.key}_${usedAddress?.address}`,
        );
    });
});
