import { Form } from '@suite-native/forms';
import { act } from '@suite-native/test-utils';
import { renderHookWithStoreProviderAsync, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, usdcAsset } from '@suite-native/trading-fixtures';
import { ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeReceiveCard } from '../ExchangeReceiveCard';

describe('ExchangeReceiveCard', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeBuyCard = () =>
        renderWithStoreProviderAsync(<ExchangeReceiveCard />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render all components', async () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', exchangeQuotes[0]);
        });
        const { getByText, getByLabelText } = await renderExchangeBuyCard();

        expect(getByText('You get')).toBeOnTheScreen();
        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You get')).toHaveDisplayValue('0.00083554');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
