import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { getBtcAccount } from '../../../../__fixtures__/account';
import { ReceiveAccountPicker, ReceiveAccountPickerProps } from '../ReceiveAccountPicker';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('ReceiveAccountPicker', () => {
    const renderReceiveAccountPicker = (props: Partial<ReceiveAccountPickerProps>) => {
        const btcAccount = getBtcAccount();
        const address = btcAccount.addresses!.used[0];

        return renderWithBasicProvider(
            <ReceiveAccountPicker
                symbol="btc"
                receiveAccount={{ account: btcAccount, address }}
                {...props}
            />,
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
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', { symbol: 'btc' });
    });

    it('should display account name', () => {
        const { getByText } = renderReceiveAccountPicker({
            receiveAccount: {
                account: getBtcAccount(),
                address: undefined,
            },
        });

        expect(getByText('BTC Account #1')).toBeTruthy();
    });

    it('should display account name and address', () => {
        const btcAccount = getBtcAccount();
        const { getByText } = renderReceiveAccountPicker({
            receiveAccount: {
                account: btcAccount,
                address: btcAccount.addresses!.used[0],
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
                    account: getBtcAccount(),
                    address: undefined,
                },
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/selected-account')).toHaveTextContent('BTC Account #1');
        });

        it('should render correctly with receiveAccount and address', () => {
            const btcAccount = getBtcAccount();
            const { getByTestId } = renderReceiveAccountPicker({
                receiveAccount: {
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                },
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/selected-account')).toHaveTextContent('BTC Account #1');
        });
    });
});
