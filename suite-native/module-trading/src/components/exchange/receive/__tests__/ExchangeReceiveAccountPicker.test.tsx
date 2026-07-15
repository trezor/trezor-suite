import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, fireEvent } from '@suite-native/test-utils-store';
import { btc1NormalAccount, btcAsset } from '@suite-native/trading-fixtures';
import {
    type ExchangeFormType,
    type ReceiveAccount,
    type TradeableAsset,
} from '@suite-native/trading-types';
import { mergeDeepObject } from '@trezor/utils';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeReceiveAccountPicker } from '../ExchangeReceiveAccountPicker';

const mockNavigate = jest.fn();
const btcAccountName1 = 'BTC Account #1';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

const exchangeStateWithReceiveAccount = (
    selectedReceiveAccount: ReceiveAccount | undefined,
): PreloadedStatePartial<TradingTestPreloadedState> => ({
    wallet: {
        trading: {
            exchange: {
                receiveAddress: selectedReceiveAccount?.address?.address,
                receiveAccountKey: selectedReceiveAccount?.account.key,
            },
        },
        accounts: [btc1NormalAccount],
    },
});

describe('ExchangeReceiveAccountPicker', () => {
    let exchangeForm: ExchangeFormType;

    const baseOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: createTradingFeatureFlags(),
    };

    const renderExchangeForm = () => {
        const { result } = renderHookWithTradingProvider(() => useExchangeForm(), {
            tradeType: 'exchange',
            overrides: baseOverrides,
        });

        return result.current;
    };

    const renderPicker = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderWithTradingProvider(<ExchangeReceiveAccountPicker />, {
            tradeType: 'exchange',
            overrides: mergeDeepObject(baseOverrides, overrides),
            wrapper: ({ children }) => <Form form={exchangeForm}>{children}</Form>,
        });

    const setSelectedAsset = (asset: TradeableAsset) => {
        act(() => {
            exchangeForm.setValue('receiveAsset', asset);
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        exchangeForm = renderExchangeForm();
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
            exchangeStateWithReceiveAccount({
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses?.used[0],
            }),
        );

        expect(getByText(btcAccountName1)).toBeTruthy();
    });

    it('should call navigate with correct params on press', () => {
        setSelectedAsset(btcAsset);
        const { getByText } = renderPicker(
            exchangeStateWithReceiveAccount({
                account: btc1NormalAccount,
                address: btc1NormalAccount.addresses?.used[0],
            }),
        );

        fireEvent.press(getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('ReceiveAccounts', {
            symbol: 'btc',
            tradingType: 'exchange',
        });
    });
});
