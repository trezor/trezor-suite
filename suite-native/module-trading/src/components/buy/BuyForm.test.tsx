import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { act, screen } from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import { BuyForm } from './BuyForm';
import { useBuyForm } from '../../hooks/buy/useBuyForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../hooks/general/useFocusedValueWatch'),
);

jest.mock('../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
    useRoute: () => ({ params: {} }),
}));

describe('BuyForm', () => {
    const residenceCheckDisabledOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        featureFlags: createTradingFeatureFlags(),
        wallet: {
            trading: {
                buy: {
                    buyInfo: undefined,
                },
                residence: {
                    country: undefined,
                },
            },
        },
    };

    const renderFormHook = (overrides: PreloadedStatePartial<TradingTestPreloadedState> = {}) =>
        renderHookWithTradingProvider(() => useBuyForm(), { overrides });

    const renderBuyForm = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState>,
        form: BuyFormType,
    ) =>
        renderWithTradingProvider(<BuyForm />, {
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    afterEach(() => {
        screen.unmount();
    });

    it('should render when buy data are not preloaded', () => {
        const { result } = renderFormHook(residenceCheckDisabledOverrides);
        const { queryByText, getByText, getByLabelText } = renderBuyForm(
            residenceCheckDisabledOverrides,
            result.current,
        );

        expect(getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel'))).toBeTruthy();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
        ).toHaveTextContent(
            new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
        );
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        ).toBeNull();
        expect(queryByText(getTranslation('moduleTrading.tradingScreen.paymentMethod'))).toBeNull();
        expect(
            queryByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
        ).toBeTruthy();
        expect(queryByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
        ).toBeNull();
        // country
        expect(getByText(getTranslation('moduleTrading.notSelected'))).toBeTruthy();
    });

    describe('with preloaded buy data', () => {
        let form: BuyFormType;
        const overrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: { trading: getInitializedTradingState() },
            featureFlags: createTradingFeatureFlags(),
        };

        beforeEach(() => {
            const { result } = renderFormHook(overrides);
            form = result.current;
        });

        it('should render with default values', () => {
            const { queryByText, getByLabelText, getByText } = renderBuyForm(overrides, form);

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
            ).toBeTruthy();

            expect(
                getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
            ).toHaveTextContent(/CZK/);
            expect(
                getByLabelText(getTranslation('moduleTrading.selectCoin.buttonTitle')),
            ).toHaveTextContent(
                new RegExp(`^${getTranslation('moduleTrading.selectCoin.buttonTitle')}.$`),
            );

            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
            ).toBeNull();

            expect(
                getByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
            ).toBeTruthy();
            expect(getByText('CZE')).toBeTruthy();

            expect(queryByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeNull();
            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
            ).toBeNull();
        });

        it('should render only BuyCard and Done when amount input is active', () => {
            act(() => {
                form.setValue('focusedValue', 'fiatValue');
            });
            const { queryByText, getByText } = renderBuyForm(overrides, form);

            expect(
                getByText(getTranslation('moduleTrading.selectFiat.buy.amountLabel')),
            ).toBeTruthy();
            expect(
                getByText(getTranslation('moduleTrading.selectFiat.sell.amountLabel')),
            ).toBeTruthy();

            expect(
                queryByText(getTranslation('tradingResidence.locationSettings.countryOfResidence')),
            ).toBeNull();
            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.paymentMethod')),
            ).toBeNull();
            expect(queryByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeNull();
            expect(
                queryByText(getTranslation('moduleTrading.tradingScreen.buttons.continue')),
            ).toBeNull();
        });
    });
});
