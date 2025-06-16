import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getBtcAccount } from '../../../../__fixtures__/account';
import { btcAsset } from '../../../../__fixtures__/tradeableAssets';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../../types/exchange';
import { ReceiveAccount, TradeableAsset } from '../../../../types/general';
import { ExchangeReceiveAccountPicker } from '../ExchangeReceiveAccountPicker';

const mockNavigate = jest.fn();
const btcAccountName1 = 'BTC Account #1';
const btcAddressAddress = '1BTC';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const getExchangeState = (selectedReceiveAccount: ReceiveAccount | undefined) => ({
    wallet: {
        tradingNew: {
            exchange: {
                selectedReceiveAccount,
            },
        },
    },
});

describe('ExchangeReceiveAccountPicker', () => {
    let exchangeForm: ExchangeFormType;

    const renderExchangeForm = async () => {
        const { result } = await renderHookWithStoreProviderAsync(() => useExchangeForm());

        return result.current;
    };

    const renderPicker = ({ preloadedState }: { preloadedState?: PreloadedState } = {}) =>
        renderWithStoreProviderAsync(<ExchangeReceiveAccountPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    const setSelectedAsset = (asset: TradeableAsset) => {
        act(() => {
            exchangeForm.setValue('receiveAsset', asset);
        });
    };

    beforeEach(async () => {
        jest.resetAllMocks();
        exchangeForm = await renderExchangeForm();
    });

    it('should display nothing when selectedSymbol is not specified', async () => {
        const { toJSON } = await renderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display "Not selected" when asset is not specified', async () => {
        setSelectedAsset(btcAsset);
        const { getByText } = await renderPicker();

        expect(getByText('Not selected')).toBeTruthy();
    });

    it('should display selected account name and address', async () => {
        setSelectedAsset(btcAsset);
        const btcAccount = getBtcAccount();
        const { getByText } = await renderPicker({
            preloadedState: getExchangeState({
                account: btcAccount,
                address: btcAccount.addresses?.used[0],
            }),
        });

        expect(getByText(btcAccountName1)).toBeTruthy();
        expect(getByText(btcAddressAddress)).toBeTruthy();
    });

    it('should call navigate with correct params on press', async () => {
        setSelectedAsset(btcAsset);
        const btcAccount = getBtcAccount();
        const { getByText } = await renderPicker({
            preloadedState: getExchangeState({
                account: btcAccount,
                address: btcAccount.addresses?.used[0],
            }),
        });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: 'btc',
            tradingType: 'exchange',
        });
    });
});
