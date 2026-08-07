import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act } from '@suite-native/test-utils-store';
import { btcAsset, getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';
import { PROTO } from '@trezor/connect';

import { BuyCard } from './BuyCard';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

describe('BuyCard', () => {
    let form: BuyFormType;

    const overrides = {
        wallet: { trading: getInitializedTradingState() },
        featureFlags: createTradingFeatureFlags(),
    };

    const renderForm = () => renderHookWithTradingProvider(() => useBuyForm(), { overrides });

    const renderBuyCard = (extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderWithTradingProvider(<BuyCard isAmountInputActive={false} />, {
            overrides: { ...overrides, ...extraOverrides },
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render default BuyCard', () => {
        const { getByLabelText, getByTestId, getByText } = renderBuyCard();

        expect(getByText(getTranslation('moduleTrading.selectFiat.buy.title'))).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.selectCoin.title'))).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/CZK/);
        expect(getByTestId('@trading/buyCard/fiatSection')).toHaveStyle({
            borderBottomWidth: 1,
        });
        expect(getByTestId('@trading/buyCard/cryptoSection')).toHaveStyle({
            borderBottomWidth: 0,
        });
    });

    it('should convert cryptoValue to the base unit before passing it to CryptoToFiatValueBadge when bitcoin amount unit is sats', () => {
        act(() => {
            form.setValue('asset', btcAsset);
        });
        act(() => {
            form.setValue('amountInCrypto', true);
        });
        act(() => {
            form.setValue('cryptoValue', '1234567123456');
        });

        const { getByText, queryByText } = renderBuyCard({
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        });

        expect(getByText('12345.67123456-bitcoin')).toBeOnTheScreen();
        expect(queryByText('1234567123456-bitcoin')).toBeNull();
    });
});
