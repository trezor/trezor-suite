import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { usdcAsset } from '../../../__fixtures__/tradeableAssets';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { ExchangeBuyCard } from '../ExchangeBuyCard';

describe('ExchangeBuyCard', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeBuyCard = () =>
        renderWithStoreProviderAsync(<ExchangeBuyCard />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render all components', async () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('receiveCryptoAmount', '100');
        });
        const { getByText, getByLabelText } = await renderExchangeBuyCard();

        expect(getByText('You get')).toBeOnTheScreen();
        expect(getByText('$123.00')).toBeOnTheScreen();
        expect(getByLabelText('Select coin')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You get')).toHaveDisplayValue('100');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- ETH')).toBeOnTheScreen();
    });
});
