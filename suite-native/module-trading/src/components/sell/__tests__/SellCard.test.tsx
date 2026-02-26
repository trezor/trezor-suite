import { Form } from '@suite-native/forms';
import { act, screen } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import {
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils/store';
import { getWalletState, sellQuotes, usdcAsset } from '@suite-native/trading-fixtures';
import { SellFormType } from '@suite-native/trading-types';

import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellCard } from '../SellCard';

describe('SellCard', () => {
    let form: SellFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellCard = (isAmountInputActive: boolean) => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
        preloadedState.wallet!.trading!.sell!.quotes = sellQuotes;

        return renderWithStoreProviderAsync(
            <SellCard isAmountInputActive={isAmountInputActive} />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
                preloadedState,
            },
        );
    };

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render all components for "you pay" part', async () => {
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('amountInCrypto', true);
            form.setValue('cryptoStringAmount', '100');
        });
        const { getByText, getByLabelText } = await renderSellCard(false);

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

                form.setValue('quote', sellQuotes[0]);
            });
        });

        it('should render receive method', async () => {
            const { getByText } = await renderSellCard(false);

            expect(getByText('Receive method')).toBeOnTheScreen();
        });
    });
});
