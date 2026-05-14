import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';
import { type BuyFormType } from '@suite-native/trading-types';

import {
    createTradingFeatureFlags,
    renderHookWithTradingProvider,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { useBuyForm } from '../../../hooks/buy/useBuyForm';
import { BuyCard } from '../BuyCard';

describe('BuyCard', () => {
    let form: BuyFormType;

    const overrides = {
        wallet: { trading: getInitializedTradingState() },
        featureFlags: createTradingFeatureFlags(),
    };

    const renderForm = () => renderHookWithTradingProvider(() => useBuyForm(), { overrides });

    const renderBuyCard = () =>
        renderWithTradingProvider(<BuyCard isAmountInputActive={false} />, {
            overrides,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render default BuyCard', () => {
        const { getByLabelText, getByTestId, getByText, queryByText } = renderBuyCard();

        expect(getByText(getTranslation('moduleTrading.selectFiat.buy.title'))).toBeOnTheScreen();
        expect(getByText(getTranslation('moduleTrading.selectCoin.title'))).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('moduleTrading.selectFiat.buttonTitle')),
        ).toHaveTextContent(/CZK/);
        expect(
            queryByText(getTranslation('moduleTrading.tradingScreen.receiveAccount')),
        ).toBeNull();
        expect(getByTestId('@trading/buyCard/fiatSection')).toHaveStyle({
            borderBottomWidth: 1,
        });
        expect(getByTestId('@trading/buyCard/cryptoSection')).toHaveStyle({
            borderBottomWidth: 0,
        });
    });
});
