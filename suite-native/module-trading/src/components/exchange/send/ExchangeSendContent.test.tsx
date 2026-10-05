import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository, mockNetworkIcon } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import { ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeSendContent } from './ExchangeSendContent';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../test-utils/tradingTestUtils';

jest.mock('../../../hooks/general/useAmountInputDecimals', () => ({
    useAmountInputDecimals: () => 8,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & { networks: NetworkModuleRepositoryDep } = {
    analytics: mockNativeAnalytics(),
    networks: { networkModuleRepository: mockNetworkModuleRepository() },
};

describe('ExchangeSendContent', () => {
    let form: ExchangeFormType;
    const preloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags(),
        },
    });

    const renderForm = async () =>
        await renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
            services,
        });

    const renderExchangeSendContent = async () =>
        await renderWithStoreProvider(<ExchangeSendContent />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState,
            services: {
                ...services,
                networks: { networkIcon: mockNetworkIcon(), ...services.networks },
            },
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render all components', async () => {
        await act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendCryptoAmount', '100');
        });
        const { getByText, getByLabelText } = await renderExchangeSendContent();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(/USDC/);
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toHaveDisplayValue('100');
        expect(getByText(getTranslation('moduleTrading.tradingScreen.balance'))).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });

    describe('send amount inputs', () => {
        const cryptoAmountLabel = getTranslation('moduleTrading.selectCoinToSell.amountLabel');
        const baseCurrencyAmountLabel = getTranslation(
            'moduleTrading.tradingScreen.baseCurrencyAmountLabel',
        );

        beforeEach(async () => {
            await act(() => {
                form.setValue('sendAsset', ethAsset);
            });
        });

        it('should update base currency amount when typing crypto amount', async () => {
            const { getByLabelText } = await renderExchangeSendContent();

            await userEvent.type(getByLabelText(cryptoAmountLabel), '1.5');

            expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('1500');
        });

        it('should update crypto amount when typing base currency amount', async () => {
            const { getByLabelText } = await renderExchangeSendContent();

            await userEvent.type(getByLabelText(baseCurrencyAmountLabel), '250');

            expect(form.getValues('sendCryptoAmount')).toBe('0.25');
            expect(getByLabelText(cryptoAmountLabel)).toHaveDisplayValue('0.25');
            expect(getByLabelText(baseCurrencyAmountLabel)).toHaveDisplayValue('250');
        });
    });
});
