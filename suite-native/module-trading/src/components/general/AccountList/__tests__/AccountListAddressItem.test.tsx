import { Account } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { Address } from '@trezor/blockchain-link-types';

import { ReceiveAccount } from '../../../../types/general';
import { AccountListAddressItem } from '../AccountListAddressItem';

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

describe('AccountListAddressItem', () => {
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
        const { getByText } = await renderAccountListAddressItem(receiveAccount);

        fireEvent.press(getByText('BTC_address'));

        expect(onPressMock).toHaveBeenCalled();
    });

    it('should not display caret for address addresses', async () => {
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
        const { getByText, queryByAccessibilityHint } =
            await renderAccountListAddressItem(receiveAccount);

        expect(getByText('BTC_address')).toBeTruthy();
        expect(queryByAccessibilityHint('Select to display account addresses')).toBeNull();
    });

    it('should display address', async () => {
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
            await renderAccountListAddressItem(receiveAccount);

        expect(getByText('BTC_address')).toBeTruthy();
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
        const { getByLabelText } = await renderAccountListAddressItem(receiveAccount);

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
        const { queryByLabelText } = await renderAccountListAddressItem(receiveAccount);

        expect(queryByLabelText('Balance in fiat')).toBeNull();
        expect(queryByLabelText('Balance in crypto')).toBeNull();
    });

    it('should render nothing when no address is specified', async () => {
        const receiveAccount: ReceiveAccount = {
            account: {
                key: 'btc1',
                symbol: 'btc',
                accountLabel: 'My BTC account',
                availableBalance: '10000000',
            } as unknown as Account,
            address: undefined as unknown as Address,
        };
        const { toJSON } = await renderAccountListAddressItem(receiveAccount);

        expect(toJSON()).toBeNull();
    });
});
