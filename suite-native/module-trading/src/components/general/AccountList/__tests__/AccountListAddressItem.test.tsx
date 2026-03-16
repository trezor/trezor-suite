import { type Account, type AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { type ReceiveAccount } from '@suite-native/trading-types';

import { AccountListAddressItem } from '../AccountListAddressItem';

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

const createAccount = (
    values: Pick<Account, 'key' | 'symbol' | 'accountLabel' | 'availableBalance'>,
): Account => ({
    deviceState: 'a@b:1',
    index: 0,
    path: `m/0'/0'/0'`,
    descriptor: asAccountDescriptor(''),
    accountType: 'normal',
    empty: false,
    visible: false,
    balance: '',
    formattedBalance: '',
    tokens: undefined,
    utxo: undefined,
    history: {
        total: 0,
        tokens: undefined,
        unconfirmed: 0,
        transactions: undefined,
        txids: undefined,
        addrTxCount: undefined,
    },
    metadata: { key: '' },
    ts: 0,
    networkType: 'ripple',
    marker: undefined,
    stellarCursor: undefined,
    page: undefined,
    backendType: 'blockbook',
    misc: { sequence: 0, reserve: '' },
    ...values,
});

describe(AccountListAddressItem.name, () => {
    const onPressMock = jest.fn();

    const renderAccountListAddressItem = (receiveAccount: ReceiveAccount) =>
        renderWithStoreProviderAsync(
            <AccountListAddressItem receiveAccount={receiveAccount} onPress={onPressMock} />,
        );

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: 'btc1' as AccountKey, // Todo: create properly via `createAccountKey()`
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            }),
            address: {
                address: 'BTC_address',
                balance: '5000000',
                path: '',
                transfers: 0,
                sent: '',
                received: '',
            },
        };
        const { getByText } = await renderAccountListAddressItem(receiveAccount);

        fireEvent.press(getByText('BTC_address'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should not display caret for address addresses', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: 'btc1' as AccountKey, // Todo: create properly via `createAccountKey()`
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            }),
            address: {
                address: 'BTC_address',
                balance: '5000000',
                path: '',
                transfers: 0,
                sent: '',
                received: '',
            },
        };
        const { getByText, queryByAccessibilityHint } =
            await renderAccountListAddressItem(receiveAccount);

        expect(getByText('BTC_address')).toBeTruthy();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
    });

    it('should display address', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: 'btc1' as AccountKey, // Todo: create properly via `createAccountKey()`
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            }),
            address: {
                address: 'BTC_address',
                balance: '5000000',
                path: '',
                transfers: 0,
                sent: '',
                received: '',
            },
        };
        const { getByText, queryByText, queryByAccessibilityHint, getByLabelText } =
            await renderAccountListAddressItem(receiveAccount);

        expect(getByText('BTC_address')).toBeTruthy();
        expect(queryByText('My BTC account')).toBeNull();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$5,000,000.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0.05 BTC');
    });

    it('should display zero balance', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: 'btc1' as AccountKey, // Todo: create properly via `createAccountKey()`
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            }),
            address: {
                address: 'BTC_address',
                balance: '0',
                path: '',
                transfers: 0,
                sent: '',
                received: '',
            },
        };
        const { getByLabelText } = await renderAccountListAddressItem(receiveAccount);

        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$0.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0 BTC');
    });

    it('should render nothing when no address is specified', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: 'btc1' as AccountKey, // Todo: create properly via `createAccountKey()`
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            }),
            address: undefined,
        };
        const { toJSON } = await renderAccountListAddressItem(receiveAccount);

        expect(toJSON()).toBeNull();
    });
});
