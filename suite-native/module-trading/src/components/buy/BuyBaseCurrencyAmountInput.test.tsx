import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, screen, userEvent } from '@suite-native/test-utils-store';
import { coinInfoToTradeableAsset } from '@suite-native/trading-atoms';
import { ethAsset, getInitializedTradingState, usdcAsset } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { BuyBaseCurrencyAmountInput } from './BuyBaseCurrencyAmountInput';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFiatRatesThunk: jest.fn(() => ({ type: 'mockUpdateFiatRates' })),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & { networks: NetworkModuleRepositoryDep } = {
    analytics: mockNativeAnalytics(),
    networks: { networkModuleRepository: mockNetworkModuleRepository() },
};

describe('BuyBaseCurrencyAmountInput', () => {
    let form: BuyFormType;
    const overrides = {
        wallet: { trading: getInitializedTradingState() },
        featureFlags: createTradingFeatureFlags(),
    };
    const baseCurrencyAmountLabel = getTranslation(
        'moduleTrading.tradingScreen.baseCurrencyAmountLabel',
    );

    const renderInput = async () =>
        await renderWithTradingProvider(<BuyBaseCurrencyAmountInput />, {
            overrides,
            services,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderHookWithTradingProvider(() => useBuyForm(), {
            overrides,
            services,
        });
        form = result.current;

        await act(() => {
            form.setValue('asset', ethAsset);
        });
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should set crypto value from typed base currency amount and switch to crypto amount', async () => {
        await act(() => {
            form.setValue('amountInCrypto', false);
            form.setValue('fiatValue', '50');
        });
        const { getByLabelText } = await renderInput();

        await userEvent.type(getByLabelText(baseCurrencyAmountLabel), '250');

        expect(form.getValues('cryptoValue')).toBe('0.25');
        expect(form.getValues('cryptoBaseCurrencyValue')).toBe('250');
        expect(form.getValues('fiatValue')).toBeUndefined();
        expect(form.getValues('amountInCrypto')).toBe(true);
        expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('250');
    });

    it('should display base currency amount of crypto value filled from quotes', async () => {
        await act(() => {
            form.setValue('amountInCrypto', false);
            form.setValue('cryptoValue', '0.5');
        });
        const { getByLabelText } = await renderInput();

        expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('500');
    });

    it('should convert typed base currency amount for token without decimals', async () => {
        const tokenAsset = coinInfoToTradeableAsset(usdcAsset.cryptoId, {
            symbol: 'usdc',
            name: usdcAsset.name,
            coingeckoId: usdcAsset.coingeckoId,
            services: { buy: true, sell: true, exchange: true },
        });
        await act(() => {
            form.setValue('asset', tokenAsset);
        });
        const { getByLabelText } = await renderInput();

        await userEvent.type(getByLabelText(baseCurrencyAmountLabel), '99');

        expect(form.getValues('cryptoValue')).toBe('100');
        expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('99');
    });
});
