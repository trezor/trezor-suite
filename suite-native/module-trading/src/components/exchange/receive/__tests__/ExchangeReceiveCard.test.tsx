import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils';
import { exchangeQuotes, usdcAsset } from '@suite-native/trading-fixtures';
import { type ExchangeFormType } from '@suite-native/trading-types';

import { useExchangeForm } from '../../../../hooks/exchange/useExchangeForm';
import { ExchangeReceiveCard } from '../ExchangeReceiveCard';

describe('ExchangeReceiveCard', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProvider(() => useExchangeForm());

    const renderExchangeBuyCard = () =>
        renderWithStoreProvider(<ExchangeReceiveCard />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(() => {
        const { result } = renderForm();
        form = result.current;
    });

    it('should render all components', () => {
        act(() => {
            form.setValue('receiveAsset', usdcAsset);
            form.setValue('quote', exchangeQuotes[0]);
        });
        const { getByText, getByLabelText } = renderExchangeBuyCard();

        expect(getByText('You get')).toBeOnTheScreen();
        expect(getByLabelText('Select asset')).toHaveTextContent(/USDC/);
        expect(getByLabelText('Network name')).toHaveTextContent('Ethereum');
        expect(getByLabelText('You get')).toHaveDisplayValue('0.00083554');
        expect(getByText('Balance:')).toBeOnTheScreen();
        expect(getByText('- USDC')).toBeOnTheScreen();
    });
});
