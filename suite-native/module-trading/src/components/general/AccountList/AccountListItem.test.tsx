import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { type StaticSessionId } from '@trezor/connect';

import { AccountListItem } from './AccountListItem';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

const DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

const btc10000000Account = mockWalletAccount({
    descriptor: asAccountDescriptor('abc'),
    symbol: asNetworkSymbol('btc'),
    deviceState: '1@2:3',
    accountLabel: 'My BTC account',
    availableBalance: '10000000',
});

const defaultOverrides = {
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: DEVICE_SESSION_ID,
            },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: { accounts: [btc10000000Account] },
};

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

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

describe('AccountListItem', () => {
    const onPressMock = jest.fn();

    let store: TestStore;

    const renderAccountListItem = async (
        receiveAccount: ReceiveAccount,
        overrides: Record<string, unknown> = defaultOverrides,
    ) => {
        store = createTradingTestStore({ overrides });

        return await renderWithStoreProvider(
            <AccountListItem onPress={onPressMock} receiveAccount={receiveAccount} />,
            { store },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const receiveAccount: ReceiveAccount = {
            account: btc10000000Account,
        };
        const { getByText } = await renderAccountListItem(receiveAccount);

        await fireEvent.press(getByText('My BTC account'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should render account name', async () => {
        const receiveAccount: ReceiveAccount = {
            account: btc10000000Account,
        };
        const { getByText, queryByAccessibilityHint, getByLabelText } =
            await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeTruthy();
        expect(
            queryByAccessibilityHint(getTranslation('moduleTrading.accountScreen.step2Hint')),
        ).toBeNull();
        expect(
            getByLabelText(getTranslation('moduleTrading.accountScreen.balanceFiat')),
        ).toHaveTextContent('$10,000,000.00');
        expect(
            getByLabelText(
                getTranslation('moduleTrading.accountScreen.balanceCrypto', {
                    coinLabel: 'crypto',
                }),
            ),
        ).toHaveTextContent('0.1 BTC');
    });

    it('should display caret when account defines addresses', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                ...btc10000000Account,
                addresses: {
                    change: [],
                    used: [],
                    unused: [],
                },
            },
        };
        const { getByText, getByAccessibilityHint } = await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeTruthy();
        expect(
            getByAccessibilityHint(getTranslation('moduleTrading.accountScreen.step2Hint')),
        ).toBeTruthy();
    });

    it('should display the descriptor for an account-based network', async () => {
        const account = mockWalletAccount({
            descriptor: asAccountDescriptor('0x1234567890abcdef'),
            symbol: asNetworkSymbol('eth'),
            deviceState: DEVICE_SESSION_ID,
            accountLabel: 'My ETH account',
            availableBalance: '1000000000000000000',
        });
        const { getByText } = await renderAccountListItem(
            { account },
            {
                ...defaultOverrides,
                wallet: { accounts: [account] },
            },
        );

        expect(getByText('0x 1234 5678 ... 90ab cdef')).toBeTruthy();
    });
});
