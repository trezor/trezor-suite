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
import { createTradingPreloadedState } from '../../__tests__/tradingTestUtils';
import { useSellForm } from '../../hooks/sell/useSellForm';

describe('SellCard', () => {
    let form: SellFormType;
    const preloadedState = createTradingPreloadedState({ tradeType: 'sell' });

    const renderForm = () =>
        renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState,
        });

    const renderSellCard = (isAmountInputActive: boolean) => {
        const cardPreloadedState = createTradingPreloadedState({
            tradeType: 'sell',
            overrides: {
                wallet: { trading: { sell: { quotes: sellQuotes } } },
            },
        });

        return renderWithStoreProvider(<SellCard isAmountInputActive={isAmountInputActive} />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState: cardPreloadedState,
        });
    };

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components for "you pay" part', () => {
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('amountInCrypto', true);
            form.setValue('cryptoStringAmount', '100');
        });
        const { getByText, getByLabelText } = renderSellCard(false);

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
