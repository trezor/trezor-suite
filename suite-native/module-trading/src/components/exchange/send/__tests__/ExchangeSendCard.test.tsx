import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
import { renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getWalletState, usdcAsset } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeSendCard } from '../ExchangeSendCard';

describe('ExchangeSendCard', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeSendCard = (isAmountInputActive: boolean) =>
        renderWithStoreProviderAsync(
            <ExchangeSendCard isAmountInputActive={isAmountInputActive} />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
                preloadedState: { wallet: getWalletState() },
            },
        );

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render all components', async () => {
        act(() => {
            form.setValue('sendAsset', usdcAsset);
            form.setValue('sendCryptoAmount', '100');
        });
        const { getByText, getByLabelText } = await renderExchangeSendCard(false);

        expect(getByText('You pay')).toBeOnTheScreen();
        expect(getByText('$99.00')).toBeOnTheScreen();
        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You pay')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
