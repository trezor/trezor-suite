import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent } from '@suite-native/test-utils-store';
import { btc1NormalAccount, btcAsset } from '@suite-native/trading-fixtures';
import {
    type BuyFormType,
    type ReceiveAccount,
    type TradeableAsset,
} from '@suite-native/trading-types';

import { BuyReceiveAccountPicker } from './BuyReceiveAccountPicker';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const mockNavigate = jest.fn();
const btcAccountName1 = 'BTC Account #1';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const tradingStateWithReceiveAccount = (
    selectedReceiveAccount: ReceiveAccount | undefined,
): PreloadedStatePartial<TradingTestPreloadedState> => ({
    wallet: {
        trading: {
            buy: {
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
        const { result } = renderHookWithTradingProvider(() => useBuyForm(), {
            tradeType: 'buy',
        });

        return result.current;
    };

    const renderPicker = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderWithTradingProvider(<BuyReceiveAccountPicker />, {
            tradeType: 'buy',
            overrides,
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

        expect(getByText(getTranslation('moduleTrading.notSelected'))).toBeTruthy();
    });

    it('should display selected account name', () => {
        setSelectedAsset(btcAsset);
        const { getByText } = renderPicker(
            tradingStateWithReceiveAccount({
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses?.used[0],
            }),
        );

        expect(getByText(btcAccountName1)).toBeTruthy();
    });

    it('should call navigate with correct params on press', () => {
        setSelectedAsset(btcAsset);
        const { getByText } = renderPicker(
            tradingStateWithReceiveAccount({
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses?.used[0],
            }),
        );

        fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: 'btc',
            tradingType: 'buy',
        });
    });
});
