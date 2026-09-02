import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
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

const services: NativeAnalyticsDep & NetworkModuleRepositoryDep = {
    analytics: mockNativeAnalytics(),
    networkModuleRepository: mockNetworkModuleRepository(),
};

describe('BuyCard', () => {
    let form: BuyFormType;

    const overrides = {
        wallet: { trading: getInitializedTradingState() },
        featureFlags: createTradingFeatureFlags(),
    };

    const renderForm = async () =>
        await renderHookWithTradingProvider(() => useBuyForm(), { overrides, services });

    const renderBuyCard = async (
        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderWithTradingProvider(<BuyCard isAmountInputActive={false} />, {
            overrides: { ...overrides, ...extraOverrides },
            services,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render default BuyCard', async () => {
        const { getByLabelText, getByTestId, getByText } = await renderBuyCard();

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

    it('should convert cryptoValue to the base unit before passing it to CryptoToFiatValueBadge when bitcoin amount unit is sats', async () => {
        await act(() => {
            form.setValue('asset', btcAsset);
        });
        await act(() => {
            form.setValue('amountInCrypto', true);
        });
        await act(() => {
            form.setValue('cryptoValue', '1234567123456');
        });

        const { getByText, queryByText } = await renderBuyCard({
            wallet: { settings: { bitcoinAmountUnit: PROTO.AmountUnit.SATOSHI } },
        });

        expect(getByText('12345.67123456-bitcoin')).toBeOnTheScreen();
        expect(queryByText('1234567123456-bitcoin')).toBeNull();
    });
});
