import { useNavigation } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { Address } from '@trezor/blockchain-link-types';

import { ReceiveAccount } from '../../../types';
import { ReceiveAccountPicker } from '../ReceiveAccountPicker';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: jest.fn(),
}));

const btcAccountName1 = 'BTC Account #1';

const btcAddressAddress = 'abc123';

const btcAddress: Address = {
    address: btcAddressAddress,
    path: '1/1/1',
    transfers: 0,
    balance: 0.0,
    sent: '0',
    received: '0',
} as unknown as Address;

const btcAccount: Account = {
    symbol: 'btc',
    accountLabel: btcAccountName1,
    deviceState: 'device@state:1',
    addresses: {
        change: [],
        used: [],
        unused: [btcAddress],
    },
    key: 'btc1',
    visible: true,
    networkType: 'bitcoin',
} as unknown as Account;

const getBuyState = (selectedReceiveAccount: ReceiveAccount | undefined) => ({
    wallet: {
        tradingNew: {
            buy: {
                selectedReceiveAccount,
            },
        },
    },
});

describe('ReceiveAccountPicker', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    const renderPicker = ({
        selectedSymbol,
        preloadedState,
    }: {
        selectedSymbol: NetworkSymbol | undefined;
        preloadedState?: PreloadedState;
    }) =>
        renderWithStoreProviderAsync(<ReceiveAccountPicker selectedSymbol={selectedSymbol} />, {
            preloadedState,
        });

    it('should display "Select coin first" when selectedSymbol is not specified', async () => {
        const { getByText } = await renderPicker({ selectedSymbol: undefined });
        expect(getByText('Select coin first')).toBeDefined();
    });

    it('should not call showSheet when selectedSymbol is not specified', async () => {
        const openAccountPicker = jest.fn();
        const { getByText } = await renderPicker({ selectedSymbol: undefined });

        fireEvent.press(getByText('Receive account'));

        expect(openAccountPicker).not.toHaveBeenCalled();
    });

    it('should display "Not selected" when selectedValue is not specified', async () => {
        const { getByText } = await renderPicker({ selectedSymbol: 'btc' });

        expect(getByText('Not selected')).toBeDefined();
    });

    it('should call openAccountPicker when selectedSymbol is specified and picker pressed', async () => {
        const navigate = jest.fn(); // Create a mock function
        (useNavigation as jest.Mock).mockReturnValue({ navigate });

        const { getByText } = await renderPicker({
            selectedSymbol: 'etc',
            preloadedState: getBuyState(undefined),
        });

        fireEvent.press(getByText('Receive account'));

        expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('should display selected account name', async () => {
        const { getByText } = await renderPicker({
            selectedSymbol: 'btc',
            preloadedState: getBuyState({ account: btcAccount }),
        });

        expect(getByText(btcAccountName1)).toBeDefined();
    });

    it('should display selected account name and address', async () => {
        const { getByText } = await renderPicker({
            selectedSymbol: 'btc',
            preloadedState: getBuyState({ account: btcAccount, address: btcAddress }),
        });

        expect(getByText(btcAccountName1)).toBeDefined();
        expect(getByText(btcAddressAddress)).toBeDefined();
    });
});
