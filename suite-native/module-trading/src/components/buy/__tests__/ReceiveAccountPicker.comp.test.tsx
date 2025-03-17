import { NetworkSymbol } from '@suite-common/wallet-config';
import { PreloadedState, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { ReceiveAccount } from '../../../types';
import { ReceiveAccountPicker } from '../ReceiveAccountPicker';

let mockNavigate: jest.Mock;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const btcAccountName1 = 'BTC Account #1';
const btcAddressAddress = '1BTC';

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

    beforeEach(() => {
        mockNavigate = jest.fn();
    });

    it('should display "Select coin first" when selectedSymbol is not specified', async () => {
        const { getByText } = await renderPicker({ selectedSymbol: undefined });
        expect(getByText('Select coin first')).toBeDefined();
    });

    it('should not call navigate on press when selectedSymbol is not specified', async () => {
        const { getByText } = await renderPicker({ selectedSymbol: undefined });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should display "Not selected" when selectedValue is not specified', async () => {
        const { getByText } = await renderPicker({ selectedSymbol: 'btc' });

        expect(getByText('Not selected')).toBeDefined();
    });

    it('should call navigate to account picker when selectedSymbol is specified and picker pressed', async () => {
        const { getByText } = await renderPicker({
            selectedSymbol: 'etc',
            preloadedState: getBuyState(undefined),
        });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', expect.anything());
    });

    it('should display selected account name', async () => {
        const { getByText } = await renderPicker({
            selectedSymbol: 'btc',
            preloadedState: getBuyState({ account: getBtcAccount() }),
        });

        expect(getByText(btcAccountName1)).toBeDefined();
    });

    it('should display selected account name and address', async () => {
        const btcAccount = getBtcAccount();
        const { getByText } = await renderPicker({
            selectedSymbol: 'btc',
            preloadedState: getBuyState({
                account: btcAccount,
                address: btcAccount.addresses?.used[0],
            }),
        });

        expect(getByText(btcAccountName1)).toBeDefined();
        expect(getByText(btcAddressAddress)).toBeDefined();
    });
});
