import { Form } from '@suite-native/forms';
import {
    type TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { selectIsAmountInputActive } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';

import { useBuyForm } from '../../buy/useBuyForm';
import { useFocusedValueWatch } from '../useFocusedValueWatch';

jest.mock('../useFocusedValueWatch', () => jest.requireActual('../useFocusedValueWatch'));

describe('useFocusedValueWatch', () => {
    let form: BuyFormType;
    let store: TestStore;

    const renderForm = () => renderHookWithStoreProviderAsync(() => useBuyForm());

    const renderUseFocusedValueWatch = () =>
        renderHookWithStoreProviderAsync(({ watch }) => useFocusedValueWatch(watch), {
            initialProps: { watch: form.watch },
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    beforeEach(async () => {
        const { result } = await renderForm();
        form = result.current;

        store = initStore().store;
    });

    it('should return false by default', async () => {
        const { result } = await renderUseFocusedValueWatch();

        expect(result.current).toEqual(false);
        expect(selectIsAmountInputActive(store.getState())).toBe(false);
    });

    it('should be false right after input is focused', async () => {
        const { result, rerender } = await renderUseFocusedValueWatch();

        act(() => {
            form.setValue('focusedValue', 'fiatValue');
            rerender({ watch: form.watch });
        });

        // make sure state is updated
        await act(() => Promise.resolve());

        expect(result.current).toEqual(false);
        expect(selectIsAmountInputActive(store.getState())).toBe(false);
    });

    it('should be true after 300ms of input focus', async () => {
        const { result, rerender } = await renderUseFocusedValueWatch();

        await act(() => {
            form.setValue('focusedValue', 'fiatValue');
        });
        rerender({ watch: form.watch });
        await act(async () => {
            // temporary: find the proper async timer handling
            // https://github.com/trezor/trezor-suite/issues/19553
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        expect(result.current).toEqual(true);
        expect(selectIsAmountInputActive(store.getState())).toBe(true);
    });

    it('should set isAmountInputActive to false on unmount', async () => {
        const { rerender, unmount } = await renderUseFocusedValueWatch();
        await act(() => {
            form.setValue('focusedValue', 'fiatValue');
        });
        rerender({ watch: form.watch });
        await act(async () => {
            // temporary: find the proper async timer handling
            // https://github.com/trezor/trezor-suite/issues/19553
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        unmount();

        expect(selectIsAmountInputActive(store.getState())).toBe(false);
    });
});
