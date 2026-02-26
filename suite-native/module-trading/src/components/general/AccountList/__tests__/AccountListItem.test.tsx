import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { fireEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { ReceiveAccount } from '@suite-native/trading-types';
import { StaticSessionId } from '@trezor/connect';

import { AccountListItem } from '../AccountListItem';

const DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

const btc10000000Account = mockWalletAccount({
    descriptor: asAccountDescriptor('abc'),
    symbol: 'btc',
    deviceState: '1@2:3',
    accountLabel: 'My BTC account',
    availableBalance: '10000000',
});

const defaultPreloadedState = {
    device: {
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
        preloadedState = defaultPreloadedState,
    ) => {
        store = initStore(preloadedState).store;

        return renderWithStoreProviderAsync(
            <AccountListItem onPress={onPressMock} receiveAccount={receiveAccount} />,
            { store },
        );
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const receiveAccount: ReceiveAccount = {
            account: btc10000000Account,
        };
        const { getByText } = await renderAccountListItem(receiveAccount);

        fireEvent.press(getByText('My BTC account'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should render account name', async () => {
        const receiveAccount: ReceiveAccount = {
            account: btc10000000Account,
        };
        const { getByText, queryByAccessibilityHint, getByLabelText } =
            await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeTruthy();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$10,000,000.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0.1 BTC');
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
        expect(getByAccessibilityHint('Select to display account addresses')).toBeTruthy();
    });
});
