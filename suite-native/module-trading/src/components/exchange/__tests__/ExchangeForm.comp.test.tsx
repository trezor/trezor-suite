import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { btcAsset } from '../../../__fixtures__/tradeableAssets';
import { useExchangeForm } from '../../../hooks/exchange/useExchangeForm';
import { ExchangeFormType } from '../../../types/exchange';
import { ExchangeForm } from '../ExchangeForm';

describe('ExchangeForm', () => {
    let form: ExchangeFormType;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useExchangeForm());

    const renderExchangeForm = () =>
        renderWithStoreProviderAsync(<ExchangeForm />, {
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;
    });

    it('should render form', async () => {
        const { getByText, queryByText } = await renderExchangeForm();

        expect(getByText('You get')).toBeOnTheScreen();
        expect(queryByText('Done')).toBeNull();
        expect(queryByText('Receive account')).toBeNull();
    });

    describe('with receive asset selected', () => {
        beforeEach(() => {
            act(() => {
                form.setValue('receiveAsset', btcAsset);
            });
        });

        it('should display Receive account picker', async () => {
            const { getByText, queryByText } = await renderExchangeForm();

            expect(getByText('You get')).toBeOnTheScreen();
            expect(queryByText('Done')).toBeNull();
            expect(getByText('Receive account')).toBeOnTheScreen();
        });

        it('should display Done button when any input is active', async () => {
            act(() => {
                form.setValue('focusedValue', 'sendValue');
            });
            const { getByText, queryByText } = await renderExchangeForm();

            expect(getByText('You get')).toBeOnTheScreen();
            expect(getByText('Done')).toBeOnTheScreen();
            expect(queryByText('Receive account')).toBeNull();
        });
    });
});
