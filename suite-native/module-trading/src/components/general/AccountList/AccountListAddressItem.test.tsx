import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';
import { type ReceiveAccount } from '@suite-native/trading-types';

import { AccountListAddressItem } from './AccountListAddressItem';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

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
    networkType: 'ripple',
    marker: undefined,
    stellarCursor: undefined,
    page: undefined,
    backendType: 'blockbook',
    misc: { sequence: 0, reserve: '' },
    ...values,
});

describe('AccountListAddressItem', () => {
    const onPressMock = jest.fn();

    const renderAccountListAddressItem = async (
        receiveAccount: ReceiveAccount,
        isFreshAddress = false,
    ) =>
        await renderWithTradingProvider(
            <AccountListAddressItem
                receiveAccount={receiveAccount}
                isFreshAddress={isFreshAddress}
                onPress={onPressMock}
            />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
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

        await fireEvent.press(getByText('BTC_address'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should not display caret for address addresses', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
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
        expect(
            queryByAccessibilityHint(getTranslation('moduleTrading.accountScreen.step2Hint')),
        ).toBeNull();
    });

    it('should display address', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
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
        expect(
            queryByAccessibilityHint(getTranslation('moduleTrading.accountScreen.step2Hint')),
        ).toBeNull();
        expect(
            getByLabelText(getTranslation('moduleTrading.accountScreen.balanceFiat')),
        ).toHaveTextContent('$5,000,000.00');
        expect(
            getByLabelText(
                getTranslation('moduleTrading.accountScreen.balanceCrypto', {
                    coinLabel: 'crypto',
                }),
            ),
        ).toHaveTextContent('0.05 BTC');
    });

    it('should display zero balance', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
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

        expect(
            getByLabelText(getTranslation('moduleTrading.accountScreen.balanceFiat')),
        ).toHaveTextContent('$0.00');
        expect(
            getByLabelText(
                getTranslation('moduleTrading.accountScreen.balanceCrypto', {
                    coinLabel: 'crypto',
                }),
            ),
        ).toHaveTextContent('0 BTC');
    });

    it('should hide balance for a fresh address', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            }),
            address: {
                address: 'BTC_address',
                balance: '0',
                path: 'm/84/0/0',
                transfers: 0,
                sent: '',
                received: '',
            },
        };
        const { queryByLabelText } = await renderAccountListAddressItem(receiveAccount, true);

        expect(
            queryByLabelText(
                getTranslation('moduleTrading.accountScreen.balanceCrypto', {
                    coinLabel: 'crypto',
                }),
            ),
        ).toBeNull();
        expect(
            queryByLabelText(getTranslation('moduleTrading.accountScreen.balanceFiat')),
        ).toBeNull();
    });

    it('should render nothing when no address is specified', async () => {
        const receiveAccount: ReceiveAccount = {
            account: createAccount({
                key: mockAccountKey({ symbol: 'btc', descriptor: 'btc1' }),
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
