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
    screen,
} from '@suite-native/test-utils-store';
import { sellQuotes, usdcAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { SellCard } from './SellCard';
import { useSellForm } from '../../hooks/sell/useSellForm';
import { createTradingPreloadedState } from '../../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: {} }),
}));

const services: NativeAnalyticsDep & NetworkModuleRepositoryDep = {
    analytics: mockNativeAnalytics(),
    networkModuleRepository: mockNetworkModuleRepository(),
};

describe('SellCard', () => {
    let form: SellFormType;
    const preloadedState = createTradingPreloadedState({ tradeType: 'sell' });

    const renderForm = async () =>
        await renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState,
            services,
        });

    const renderSellCard = async (isAmountInputActive: boolean) => {
        const cardPreloadedState = createTradingPreloadedState({
            tradeType: 'sell',
            overrides: {
                wallet: { trading: { sell: { quotes: sellQuotes } } },
            },
        });

        return await renderWithStoreProvider(
            <SellCard isAmountInputActive={isAmountInputActive} />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
                preloadedState: cardPreloadedState,
                services,
            },
        );
    };

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    afterEach(async () => {
        await screen.unmount();
    });

    it('should render all components for "you pay" part', async () => {
        await act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('amountInCrypto', true);
            form.setValue('cryptoStringAmount', '100');
        });
        const { getByText, getByLabelText } = await renderSellCard(false);

        expect(
            getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toBeOnTheScreen();
        expect(getByText('$99.00')).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(/USDC/);
        expect(getByLabelText(getTranslation('moduleTrading.networkName'))).toHaveTextContent(
            'Ethereum',
        );
        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
        ).toHaveDisplayValue('100');
        expect(getByText(getTranslation('moduleTrading.tradingScreen.balance'))).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
