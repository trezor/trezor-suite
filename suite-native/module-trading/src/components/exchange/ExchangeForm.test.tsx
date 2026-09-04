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
    screen,
} from '@suite-native/test-utils-store';
import {
    btcAsset,
    getInitializedTradingState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { ExchangeForm } from './ExchangeForm';
import { useExchangeForm } from '../../hooks/exchange/useExchangeForm';
import {
    createTradingFeatureFlags,
    createTradingPreloadedState,
} from '../../test-utils/tradingTestUtils';

jest.mock('../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../hooks/general/useFocusedValueWatch'),
);

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & { networks: GetSupportedNetworksDep } = {
    analytics: mockNativeAnalytics(),
    networks: { getSupportedNetworks: mockGetSupportedNetworks() },
};

describe('ExchangeForm', () => {
    let form: ExchangeFormType;
    const defaultPreloadedState = createTradingPreloadedState({
        tradeType: 'exchange',
        overrides: {
            featureFlags: createTradingFeatureFlags(),
        },
    });

    const renderForm = async () =>
        await renderHookWithStoreProvider(() => useExchangeForm(), {
            preloadedState: defaultPreloadedState,
            services,
        });

    const renderExchangeForm = async () =>
        await renderWithStoreProvider(<ExchangeForm />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            services,
            preloadedState: {
                ...defaultPreloadedState,
                wallet: {
                    ...defaultPreloadedState.wallet,
                    trading: getInitializedTradingState(),
                },
            },
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render form', async () => {
        const { getByText, queryByText } = await renderExchangeForm();

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('generic.buttons.done'))).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        ).toBeNull();
    });

    describe('with receive asset selected', () => {
        beforeEach(async () => {
            await act(() => {
                form.setValue('receiveAsset', btcAsset);
            });
        });

        it('should display Receive account picker', async () => {
            const { getByText, queryByText } = await renderExchangeForm();

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            ).toBeOnTheScreen();
            expect(queryByText(getTranslation('generic.buttons.done'))).toBeNull();
            expect(
                getByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
            ).toBeOnTheScreen();
        });

        it('should display Done button when any input is active', async () => {
            await act(() => {
                form.setValue('focusedValue', 'sendCryptoAmount');
            });
            const { getByText, queryByText } = await renderExchangeForm();

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            ).toBeOnTheScreen();
            expect(getByText(getTranslation('generic.buttons.done'))).toBeOnTheScreen();
            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
            ).toBeNull();
        });

        describe('with quote selected', () => {
            beforeEach(async () => {
                await act(() => {
                    form.setValue('quote', mercuryoFixedWorstQuote);
                });
            });

            it('should display provider', async () => {
                const { getByText } = await renderExchangeForm();

                expect(
                    getByText(getTranslation('moduleTrading.tradingScreen.provider')),
                ).toBeOnTheScreen();
            });
        });
    });
});
