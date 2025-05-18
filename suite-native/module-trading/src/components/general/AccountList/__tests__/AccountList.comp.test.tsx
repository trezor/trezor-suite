import { useNavigation } from '@react-navigation/native';

import { Account } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { Address } from '@trezor/blockchain-link-types';
import { StaticSessionId } from '@trezor/connect';

import fixturesAccounts from '../../../../__fixtures__/accounts.json';
import { ReceiveAccount } from '../../../../types';
import { AccountList, AccountsListProps, keyExtractor } from '../AccountList';

const accounts = fixturesAccounts as Account[];
const defaultPreloadedState = {
    device: {
        selectedDevice: {
            state: {
                staticSessionId: 'staticSessionId' as StaticSessionId,
            },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: { accounts },
};

const getStateMockup = (selectedAccount: ReceiveAccount) => ({
    ...defaultPreloadedState,
    wallet: {
        accounts: defaultPreloadedState.wallet.accounts,
        tradingNew: {
            buy: {
                selectedReceiveAccount: selectedAccount,
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

    const renderComponent = (
        props: Partial<AccountsListProps>,
        preloadedState = defaultPreloadedState,
    ) =>
        renderWithStoreProviderAsync(
            <AccountList
                symbol="btc"
                pickerMode="account"
                onAddAccountTap={jest.fn()}
                onSetPickerMode={jest.fn()}
                {...props}
            />,
            { preloadedState },
        );

    describe('renderItem', () => {
        it('should display all accounts for given symbol', async () => {
            const { getByText } = await renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
            });

            expect(getByText('BTC Account #1')).toBeTruthy();
            expect(getByText('BTC Account #2')).toBeTruthy();
        });

        it('should display addresses when picker mode is set and account is selected', async () => {
            const { getByText } = await renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                },
                getStateMockup({ account: accounts[0] }),
            );

            const item = getByText('UNUSED1');
            expect(item).toBeTruthy();
        });
    });

    describe('onItemSelect', () => {
        it('should call onSetPickerMode when account is selected in account mode', async () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });

            const { getByText } = await renderComponent({
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

        it('should popToTop when account is selected in account mode and there are no addresses', async () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });

            const { getByText } = await renderComponent({
                symbol: 'eth',
                pickerMode: 'account',
                onSetPickerMode: onSetPickerModeMock,
            });

            const item = getByText('ETH Account #1');
            expect(item).toBeTruthy();

            fireEvent.press(item);

            expect(popToTop).toHaveBeenCalled();
        });

        it('should handle address selection in address mode', async () => {
            (useNavigation as jest.Mock).mockReturnValue({ popToTop });
            const { getByText } = await renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                    onSetPickerMode: onSetPickerModeMock,
                },
                getStateMockup({ account: accounts[0] }),
            );

            const item = getByText('UNUSED1');
            expect(item).toBeTruthy();

            fireEvent.press(item);

            expect(popToTop).toHaveBeenCalled();
        });
    });

    describe('footer', () => {
        it('should display footer with "Add new" button in "account" mode', async () => {
            const { getByText } = await renderComponent({
                symbol: 'btc',
                pickerMode: 'account',
            });

            expect(getByText('Add new')).toBeTruthy();
        });

        it('should NOT display footer with "Add new" button in "address" mode', async () => {
            const { queryByText } = await renderComponent(
                {
                    symbol: 'btc',
                    pickerMode: 'address',
                },
                getStateMockup({ account: accounts[0] }),
            );

            expect(queryByText('Add new')).toBeNull();
        });
    });

    describe('keyExtractor', () => {
        it('should use default string for undefined address', () => {
            expect(keyExtractor({ account: accounts[0], address: undefined })).toBe(
                'btc1_address_undefined',
            );
        });

        it('should use address string for set address', () => {
            expect(
                keyExtractor({ account: accounts[0], address: { address: 'ADDRESS1' } as Address }),
            ).toBe('btc1_ADDRESS1');
        });
    });
});
