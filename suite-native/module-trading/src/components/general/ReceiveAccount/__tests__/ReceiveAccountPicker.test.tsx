import { fireEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils/store';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { ReceiveAccountPicker, ReceiveAccountPickerProps } from '../ReceiveAccountPicker';

const defaultPreloadedState = {
    device: {
        selectedDevice: {
            state: { staticSessionId: btc1NormalAccount.deviceState },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: { accounts: [btc1NormalAccount] },
};

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ReceiveAccountPicker', () => {
    let store: TestStore;

    const renderReceiveAccountPicker = (
        props: Partial<ReceiveAccountPickerProps>,
        preloadedState = defaultPreloadedState,
    ) => {
        store = initStore(preloadedState).store;

        return renderWithStoreProvider(
            <ReceiveAccountPicker
                symbol="btc"
                tradingType="buy"
                receiveAccount={{
                    account: btc1NormalAccount,
                    address: btc1NormalAccount.addresses!.used[0],
                }}
                {...props}
            />,
            { store },
        );
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should display nothing when selectedSymbol is not specified', () => {
        const { toJSON } = renderReceiveAccountPicker({ symbol: undefined });

        expect(toJSON()).toBeNull();
    });

    it('should display "Not selected" when receiveAccount is not specified', () => {
        const { getByText } = renderReceiveAccountPicker({
            receiveAccount: undefined,
        });

        expect(getByText('Not selected')).toBeTruthy();
    });

    it('should call navigate to account picker when symbol is specified and picker pressed', () => {
        const { getByText } = renderReceiveAccountPicker({
            symbol: 'btc',
            receiveAccount: undefined,
        });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: 'btc',
            tradingType: 'buy',
        });
    });

    it('should call navigate to account picker when tradingType is exchange, symbol is specified and picker pressed', () => {
        const { getByText } = renderReceiveAccountPicker({
            symbol: 'btc',
            receiveAccount: undefined,
            tradingType: 'exchange',
        });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: 'btc',
            tradingType: 'exchange',
        });
    });

    it.skip('should display account name', () => {
        const { getByText } = renderReceiveAccountPicker({
            receiveAccount: {
                account: btc1NormalAccount,
                address: undefined,
            },
        });

        expect(getByText('BTC Account #1')).toBeTruthy();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should display account name and address', () => {
        const { getByText } = renderReceiveAccountPicker({
            receiveAccount: {
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses!.used[0],
            },
        });

        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(getByText('1BTC')).toBeTruthy();
    });

    describe('with testID specified', () => {
        it('should render correctly with no receiveAccount', () => {
            const { getByTestId } = renderReceiveAccountPicker({
                receiveAccount: undefined,
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/not-selected')).toHaveTextContent('Not selected');
        });

        it('should render correctly with receiveAccount but no address', () => {
            const { getByTestId } = renderReceiveAccountPicker({
                receiveAccount: {
                    account: btc1NormalAccount,
                    address: undefined,
                },
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/selected-account')).toHaveTextContent('BTC Account #1');
        });

        it('should render correctly with receiveAccount and address', () => {
            const { getByTestId } = renderReceiveAccountPicker({
                receiveAccount: {
                    account: btc1NormalAccount,
                    address: btc1NormalAccount.addresses!.used[0],
                },
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/selected-account')).toHaveTextContent('BTC Account #1');
        });
    });
});
