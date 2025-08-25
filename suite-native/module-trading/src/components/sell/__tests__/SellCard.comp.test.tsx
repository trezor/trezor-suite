import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { getWalletState } from '../../../__fixtures__/walletState';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../types/sell';
import { SellCard } from '../SellCard';

describe('SellCard', () => {
    let form: SellFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useSellForm());

    const renderSellCard = (isAmountInputActive: boolean) =>
        renderWithStoreProviderAsync(<SellCard isAmountInputActive={isAmountInputActive} />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
            preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) },
        });

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
        //expect(getByText('$99.00')).toBeOnTheScreen();
        expect(getByLabelText('Select coin')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You pay')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
