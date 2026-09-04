import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getTranslation } from '@suite-native/intl';
import { type TestStore, fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { ReceiveAccountPicker, type ReceiveAccountPickerProps } from './ReceiveAccountPicker';
import { createTradingTestStore } from '../../../test-utils/tradingTestUtils';

const btcSymbol = asNetworkSymbol('btc');

const defaultOverrides = {
    device: {
        devices: [],
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

    const renderReceiveAccountPicker = async (
        props: Partial<ReceiveAccountPickerProps>,
        overrides: Record<string, unknown> = defaultOverrides,
    ) => {
        store = createTradingTestStore({ overrides });

        return await renderWithStoreProvider(
            <ReceiveAccountPicker
                symbol={btcSymbol}
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
        jest.clearAllMocks();
    });

    it('should display nothing when selectedSymbol is not specified', async () => {
        const { toJSON } = await renderReceiveAccountPicker({ symbol: undefined });

        expect(toJSON()).toBeNull();
    });

    it('should display "Not selected" when receiveAccount is not specified', async () => {
        const { getByText } = await renderReceiveAccountPicker({
            receiveAccount: undefined,
        });

        expect(getByText(getTranslation('moduleTrading.notSelected'))).toBeTruthy();
    });

    it('should call navigate to account picker when symbol is specified and picker pressed', async () => {
        const { getByText } = await renderReceiveAccountPicker({
            symbol: btcSymbol,
            receiveAccount: undefined,
        });

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        );

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: btcSymbol,
            tradingType: 'buy',
        });
    });

    it('should call navigate to account picker when tradingType is exchange, symbol is specified and picker pressed', async () => {
        const { getByText } = await renderReceiveAccountPicker({
            symbol: btcSymbol,
            receiveAccount: undefined,
            tradingType: 'exchange',
        });

        await fireEvent.press(
            getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        );

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: btcSymbol,
            tradingType: 'exchange',
        });
    });

    it('should display account name', async () => {
        const { getByText } = await renderReceiveAccountPicker({
            receiveAccount: {
                account: btc1NormalAccount,
                address: undefined,
            },
        });

        expect(getByText('BTC Account #1')).toBeTruthy();
    });

    it('should display account name when address is selected', async () => {
        const { getByText } = await renderReceiveAccountPicker({
            receiveAccount: {
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses!.used[0],
            },
        });

        expect(getByText('BTC Account #1')).toBeTruthy();
    });

    describe('with testID specified', () => {
        it('should render correctly with no receiveAccount', async () => {
            const { getByTestId } = await renderReceiveAccountPicker({
                receiveAccount: undefined,
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/not-selected')).toHaveTextContent(
                getTranslation('moduleTrading.notSelected'),
            );
        });

        it('should render correctly with receiveAccount but no address', async () => {
            const { getByTestId } = await renderReceiveAccountPicker({
                receiveAccount: {
                    account: btc1NormalAccount,
                    address: undefined,
                },
                testID: 'TEST_ID',
            });

            expect(getByTestId('TEST_ID/selected-account')).toHaveTextContent('BTC Account #1');
        });

        it('should render correctly with receiveAccount and address', async () => {
            const { getByTestId } = await renderReceiveAccountPicker({
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
