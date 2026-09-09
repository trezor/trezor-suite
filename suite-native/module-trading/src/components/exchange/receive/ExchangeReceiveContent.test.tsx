import type { GetSupportedNetworksDep } from '@suite-common/networks';
import { mockGetSupportedNetworks } from '@suite-common/networks/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { btcAsset, mercuryoFixedWorstQuote, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeReceiveContent } from './ExchangeReceiveContent';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & { networks: GetSupportedNetworksDep } = {
    analytics: mockNativeAnalytics(),
    networks: { getSupportedNetworks: mockGetSupportedNetworks() },
};

describe('ExchangeReceiveContent', () => {
    let form: ExchangeFormType;
    const preloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags(),
            wallet: {
                trading: {
                    exchange: {
                        exchangeInfo: {
                            buyCryptoIds: [],
                        },
                    },
                },
            },
        },
    });

    const renderForm = async () =>
        await renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState,
            services,
        });

    const renderExchangeReceiveContent = async () =>
        await renderWithStoreProvider(<ExchangeReceiveContent />, {
            preloadedState,
            services,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render all components', async () => {
        await act(() => {
            form.setValue('sendAsset', btcAsset);
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', {
                ...mercuryoFixedWorstQuote,
                send: btcAsset.cryptoId,
                receive: usdcAsset.cryptoId,
            });
        });
        const { getByText, getByLabelText } = await renderExchangeReceiveContent();

        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(/USDC/);
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.amountLabel')),
        ).toHaveDisplayValue('0.00083554');
        expect(getByText(getTranslation('moduleTrading.tradingScreen.balance'))).toBeOnTheScreen();
        expect(getByText('- ' + usdcAsset.symbol)).toBeOnTheScreen();
    });
});
