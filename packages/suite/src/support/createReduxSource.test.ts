import { configureStore, createSlice } from '@reduxjs/toolkit';

import { createReduxSource } from './createReduxSource';

const slice = createSlice({
    name: 'test',
    initialState: { value: 1, other: 0 },
    reducers: {
        setValue: (state, action: { payload: number }) => {
            state.value = action.payload;
        },
        setOther: (state, action: { payload: number }) => {
            state.other = action.payload;
        },
    },
});

describe(createReduxSource.name, () => {
    it('calls a listener only when the selected value changes', () => {
        const store = configureStore({ reducer: slice.reducer });
        const source = createReduxSource({
            getState: store.getState,
            subscribe: store.subscribe,
            select: state => state.value,
        });
        const listener = jest.fn();
        source.subscribe(listener);

        store.dispatch(slice.actions.setOther(5));
        expect(listener).not.toHaveBeenCalled();

        store.dispatch(slice.actions.setValue(2));
        expect(listener).toHaveBeenCalledTimes(1);
        expect(source.getSnapshot()).toBe(2);
    });
});
