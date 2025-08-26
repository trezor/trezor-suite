import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { sellQuotes } from '../../../__fixtures__/sellQuotes';
import { usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../types/sell';
import { SellCard } from '../SellCard';

describe('SellCard', () => {
    let form: SellFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellCard = (isAmountInputActive: boolean) => {
        const preloadedState = { wallet: getWalletState({ tradeType: 'sell' }) };
        preloadedState.wallet!.tradingNew!.sell!.quotes = sellQuotes;

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

    it('should render all components for "you pay" part', async () => {
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('amountInCrypto', true);
            form.setValue('cryptoStringAmount', '100');
        });
        const { getByText, getByLabelText } = await renderSellCard(false);

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('$99.00')).toBeOnTheScreen();
        expect(getByLabelText('Select coin')).toHaveTextContent(/USDC/);
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
