import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { ExchangeSendCard } from '../ExchangeSendCard';

describe('ExchangeSendCard', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeSendCard = (isAmountInputActive: boolean) =>
        renderWithStoreProviderAsync(
            <ExchangeSendCard isAmountInputActive={isAmountInputActive} />,
            {
                wrapper: ({ children }) => <Form form={form}>{children}</Form>,
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
        expect(getByText('$123.00')).toBeOnTheScreen();
        expect(getByLabelText('Select coin')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You pay')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- ETH')).toBeOnTheScreen();
    });
});
