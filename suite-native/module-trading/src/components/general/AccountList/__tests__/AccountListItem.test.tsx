import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TestStore, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { type StaticSessionId } from '@trezor/connect';

import { createTradingTestStore } from '../../../../__tests__/tradingTestUtils';
import { AccountListItem } from '../AccountListItem';

const DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

const btc10000000Account = mockWalletAccount({
    descriptor: asAccountDescriptor('abc'),
    symbol: 'btc',
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

    const renderAccountListItem = (
        receiveAccount: ReceiveAccount,
        overrides: Record<string, unknown> = defaultOverrides,
    ) => {
        store = createTradingTestStore({ overrides });

        return renderWithStoreProvider(
            <AccountListItem onPress={onPressMock} receiveAccount={receiveAccount} />,
            { store },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onPress callback when pressed', () => {
        const receiveAccount: ReceiveAccount = {
            account: btc10000000Account,
        };
        const { getByText } = renderAccountListItem(receiveAccount);

        fireEvent.press(getByText('My BTC account'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should render account name', () => {
        const receiveAccount: ReceiveAccount = {
            account: btc10000000Account,
        };
        const { getByText, queryByAccessibilityHint, getByLabelText } =
            renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeTruthy();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$10,000,000.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0.1 BTC');
    });

    it('should display caret when account defines addresses', () => {
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
        const { getByText, getByAccessibilityHint } = renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeTruthy();
        expect(getByAccessibilityHint('Select to display account addresses')).toBeTruthy();
    });
});
