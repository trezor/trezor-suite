import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useSellForm } from '../../../hooks/sell/useSellForm';
import { SellFormType } from '../../../types/sell';
import { SellForm } from '../SellForm';

jest.mock('../../../hooks/general/useFocusedValueWatch', () =>
    jest.requireActual('../../../hooks/general/useFocusedValueWatch'),
);

describe('SellForm', () => {
    const renderFormHook = (preloadedState: PreloadedState) =>
        renderHookWithStoreProviderAsync(() => useSellForm(), { preloadedState });

    const renderSellForm = (preloadedState: PreloadedState, form: SellFormType) =>
        renderWithStoreProviderAsync(<SellForm />, {
            preloadedState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    it('should render when sell data are not preloaded', async () => {
        const { result } = await renderFormHook({});
        const { getByText, getByLabelText } = await renderSellForm({}, result.current);

        expect(getByText('You pay')).toBeTruthy();
        expect(getByText('You get')).toBeTruthy();
        expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
    });

    describe('with preloaded sell data', () => {
        let form: SellFormType;
        const preloadedState = { wallet: { tradingNew: getInitializedTradingState() } };

        beforeEach(async () => {
            const { result } = await renderFormHook(preloadedState);
            form = result.current;
        });

        it('should render with default values', async () => {
            const { getByLabelText, getByText } = await renderSellForm(preloadedState, form);

            expect(getByText('You pay')).toBeTruthy();

            expect(getByLabelText('Select fiat currency')).toBeTruthy();
            expect(getByLabelText('Select coin')).toHaveTextContent(/Select coin/);
        });

        it('should render only SellCard and Done when amount input is active', async () => {
            act(() => {
                form.setValue('focusedValue', 'fiatStringAmount');
            });
            const { queryByText, getByText } = await renderSellForm(preloadedState, form);

            expect(getByText('You pay')).toBeTruthy();
            expect(getByText('You get')).toBeTruthy();

            expect(queryByText('Continue')).toBeNull();
        });
    });
});
