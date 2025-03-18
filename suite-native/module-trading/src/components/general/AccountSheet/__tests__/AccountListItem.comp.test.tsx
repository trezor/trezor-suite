import { Account } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { Address } from '@trezor/blockchain-link-types';

import { ReceiveAccount } from '../../../../types';
import { AccountListItem } from '../AccountListItem';

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

describe('AccountListItem', () => {
    const onPressMock = jest.fn();

    const renderAccountListItem = (receiveAccount: ReceiveAccount) =>
        renderWithStoreProviderAsync(
            <AccountListItem symbol="btc" onPress={onPressMock} receiveAccount={receiveAccount} />,
        );

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should call onPress callback when pressed', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as Account,
        };
        const { getByText } = await renderAccountListItem(receiveAccount);

        fireEvent.press(getByText('BTC'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should render account name when no address is specified', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as Account,
        };
        const { getByText, queryByAccessibilityHint, getByLabelText } =
            await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeDefined();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$10,000,000.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0.1 BTC');
    });

    it('should display caret when account defines addresses', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
                addresses: {
                    change: [],
                    used: [],
                    unused: [],
                },
            } as unknown as Account,
        };
        const { getByText, getByAccessibilityHint } = await renderAccountListItem(receiveAccount);

        expect(getByText('My BTC account')).toBeDefined();
        expect(getByAccessibilityHint('Select to display account addresses')).toBeDefined();
    });

    it('should display address when specified', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as unknown as Account,
            address: {
                address: 'BTC_address',
                balance: '5000000',
            } as unknown as Address,
        };
        const { getByText, queryByText, queryByAccessibilityHint, getByLabelText } =
            await renderAccountListItem(receiveAccount);

        expect(getByText('BTC_address')).toBeDefined();
        expect(queryByText('My BTC account')).toBeNull();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$5,000,000.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0.05 BTC');
    });

    it('should display zero balance', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as unknown as Account,
            address: {
                address: 'BTC_address',
                balance: '0',
            } as unknown as Address,
        };
        const { getByLabelText } = await renderAccountListItem(receiveAccount);

        expect(getByLabelText('Balance in fiat')).toHaveTextContent('$0.00');
        expect(getByLabelText('Balance in crypto')).toHaveTextContent('0 BTC');
    });

    it('should not display balance when address has no balance', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as unknown as Account,
            address: {
                address: 'BTC_address',
            } as unknown as Address,
        };
        const { queryByLabelText } = await renderAccountListItem(receiveAccount);

        expect(queryByLabelText('Balance in fiat')).toBeNull();
        expect(queryByLabelText('Balance in crypto')).toBeNull();
    });
});
