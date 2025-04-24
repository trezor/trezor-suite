import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../__fixtures__/account';
import { useTradingBuyForm } from '../../../hooks/useTradingBuyForm';
import { ReceiveAccount, TradingBuyForm } from '../../../types';
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
    let buyForm: TradingBuyForm;

    const renderBuyForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useTradingBuyForm());

        return result.current;
    };

    const renderPicker = ({ preloadedState }: { preloadedState?: PreloadedState } = {}) =>
        renderWithStoreProviderAsync(
            <Form form={buyForm}>
                <ReceiveAccountPicker />
            </Form>,
            {
                preloadedState,
            },
        );

    const setSelectedCryptoId = (cryptoId: string) => {
        act(() => {
            buyForm.setValue('asset', { cryptoId } as any);
        });
    };

    beforeEach(async () => {
        mockNavigate = jest.fn();
        buyForm = await renderBuyForm();
    });

    it('should display "Select coin first" when selectedSymbol is not specified', async () => {
        const { getByText } = await renderPicker();
        expect(getByText('Select coin first')).toBeTruthy();
    });

    it('should not call navigate on press when selectedSymbol is not specified', async () => {
        const { getByText } = await renderPicker();

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should display "Not selected" when selectedValue is not specified', async () => {
        setSelectedCryptoId('bitcoin');
        const { getByText } = await renderPicker();

        expect(getByText('Not selected')).toBeTruthy();
    });

    it('should call navigate to account picker when selectedSymbol is specified and picker pressed', async () => {
        setSelectedCryptoId('ethereum');
        const { getByText } = await renderPicker({
            preloadedState: getBuyState(undefined),
        });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', expect.anything());
    });

    it('should display selected account name', async () => {
        setSelectedCryptoId('bitcoin');
        const { getByText } = await renderPicker({
            preloadedState: getBuyState({ account: getBtcAccount() }),
        });

        expect(getByText(btcAccountName1)).toBeTruthy();
    });

    it('should display selected account name and address', async () => {
        setSelectedCryptoId('bitcoin');
        const btcAccount = getBtcAccount();
        const { getByText } = await renderPicker({
            preloadedState: getBuyState({
                account: btcAccount,
                address: btcAccount.addresses?.used[0],
            }),
        });

        expect(getByText(btcAccountName1)).toBeTruthy();
        expect(getByText(btcAddressAddress)).toBeTruthy();
    });
});
