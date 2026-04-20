import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { banxaCreditCardSellQuote, sellQuotes, usdcAsset } from '@suite-native/trading-fixtures';
import { type SellFormType } from '@suite-native/trading-types';

import { createTradingPreloadedState } from '../../../__tests__/tradingTestUtils';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellCard } from '../SellCard';

describe('SellCard', () => {
    let form: SellFormType;
    const preloadedState = createTradingPreloadedState({ tradeType: 'sell' });

    const renderForm = () =>
        renderHookWithStoreProvider(() => useSellForm(), {
            preloadedState,
        });

    const renderSellCard = (isAmountInputActive: boolean) => {
        const cardPreloadedState = createTradingPreloadedState({ tradeType: 'sell' });
        cardPreloadedState.wallet!.trading!.sell!.quotes = sellQuotes;

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

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('$99.00')).toBeOnTheScreen();
        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You pay')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });

    describe('with selected quote', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('sendAsset', usdcAsset);
                form.setValue('amountInCrypto', true);
                form.setValue('cryptoStringAmount', '100');

                form.setValue('quote', banxaCreditCardSellQuote);
            });
        });

        it('should render receive method', () => {
            const { getByText } = renderSellCard(false);

            expect(getByText('Receive method')).toBeOnTheScreen();
        });
    });
});
