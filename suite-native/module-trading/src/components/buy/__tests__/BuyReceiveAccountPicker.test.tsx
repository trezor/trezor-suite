import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    act,
    fireEvent,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import { btc1NormalAccount, btcAsset } from '@suite-native/trading-fixtures';
import { tradingInitialState } from '@suite-native/trading-state';
import {
    type BuyFormType,
    type ReceiveAccount,
    type TradeableAsset,
} from '@suite-native/trading-types';

import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyReceiveAccountPicker } from '../BuyReceiveAccountPicker';

const mockNavigate = jest.fn();
const btcAccountName1 = 'BTC Account #1';
const btcAddressAddress = 'USED1';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const getTradingState = (selectedReceiveAccount: ReceiveAccount | undefined) => ({
    wallet: {
        trading: {
            ...tradingInitialState,
            buy: {
                ...tradingInitialState.buy,
                receiveAddress: selectedReceiveAccount?.address?.address,
                tradingAccountKey: selectedReceiveAccount?.account.key,
            },
        },
        accounts: [btc1NormalAccount],
    },
});

describe('BuyReceiveAccountPicker', () => {
    let buyForm: BuyFormType;

    const renderBuyForm = () => {
        const { result } = renderHookWithStoreProvider(() => useBuyForm());

        return result.current;
    };

    const renderPicker = ({ preloadedState }: { preloadedState?: PreloadedState } = {}) =>
        renderWithStoreProvider(<BuyReceiveAccountPicker />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={buyForm}>{children}</Form>,
        });

    const setSelectedAsset = (asset: TradeableAsset) => {
        act(() => {
            buyForm.setValue('asset', asset);
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        buyForm = renderBuyForm();
    });

    it('should display nothing when selectedSymbol is not specified', () => {
        const { toJSON } = renderPicker();

        expect(toJSON()).toBeNull();
    });

    it('should display "Not selected" when asset is not specified', () => {
        setSelectedAsset(btcAsset);
        const { getByText } = renderPicker();

        expect(getByText('Not selected')).toBeTruthy();
    });

    it('should display selected account name and address', () => {
        setSelectedAsset(btcAsset);
        const { getByText } = renderPicker({
            preloadedState: getTradingState({
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses?.used[0],
            }),
        });

        expect(getByText(btcAccountName1)).toBeTruthy();
        expect(getByText(btcAddressAddress)).toBeTruthy();
    });

    it('should call navigate with correct params on press', () => {
        setSelectedAsset(btcAsset);
        const { getByText } = renderPicker({
            preloadedState: getTradingState({
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses?.used[0],
            }),
        });

        fireEvent.press(getByText('Receive account'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: 'btc',
            tradingType: 'buy',
        });
    });
});
