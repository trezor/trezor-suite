import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeSendContent } from './ExchangeSendContent';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & NetworkModuleRepositoryDep = {
    analytics: mockNativeAnalytics(),
    networkModuleRepository: mockNetworkModuleRepository(),
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
            services,
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
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoinToSell.amountLabel')),
        ).toHaveDisplayValue('100');
        expect(getByText(getTranslation('moduleTrading.tradingScreen.balance'))).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
