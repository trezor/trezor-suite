import { selectTradingMaxSlippagePercentage } from '@suite-common/trading';
import {
    type TestStore,
    initStore,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import {
    MaxSlippageForm,
    type MaxSlippageFormProps,
    SLIPPAGE_INPUT_TEST_ID,
} from '../MaxSlippageForm';

describe('MaxSlippageForm', () => {
    const renderMaxSlippageForm = (props: Partial<MaxSlippageFormProps>, store: TestStore) =>
        renderWithStoreProviderAsync(<MaxSlippageForm onSubmit={jest.fn()} {...props} />, {
            store,
        });

    it('should render value based on store', async () => {
        const { store } = initStore();
        const { getByTestId, getByText, queryByText } = await renderMaxSlippageForm({}, store);

        expect(getByTestId(SLIPPAGE_INPUT_TEST_ID)).toHaveDisplayValue('1');
        expect(queryByText('Slippage must be between 0.01 and 50')).toBeNull();
        expect(getByText('Confirm custom slippage')).toBeEnabled();
    });

    it('should display validation error on invalid value', async () => {
        const { store } = initStore();
        const { getByTestId, getByText } = await renderMaxSlippageForm({}, store);

        await userEvent.type(getByTestId(SLIPPAGE_INPUT_TEST_ID), '999');

        expect(getByText('Slippage must be between 0.01 and 50')).toBeOnTheScreen();
        expect(getByText('Confirm custom slippage')).toBeDisabled();
    });

    it('should save slippage to store and call onSubmit', async () => {
        const { store } = initStore();
        const onSubmit = jest.fn();
        const { getByTestId, getByText } = await renderMaxSlippageForm({ onSubmit }, store);
        const input = getByTestId(SLIPPAGE_INPUT_TEST_ID);

        await userEvent.clear(input);
        await userEvent.type(input, '20');
        await userEvent.press(getByText('Confirm custom slippage'));

        expect(selectTradingMaxSlippagePercentage(store.getState())).toBe('20');
        expect(onSubmit).toHaveBeenCalled();
    });

    it('should transform value to valid number', async () => {
        const { store } = initStore();
        const { getByTestId } = await renderMaxSlippageForm({}, store);
        const input = getByTestId(SLIPPAGE_INPUT_TEST_ID);

        await userEvent.clear(input);
        await userEvent.type(input, '0,1.23');

        expect(input).toHaveDisplayValue('0.123');
    });
});
