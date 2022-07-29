import React from 'react';
import { Provider } from 'react-redux';

import { configureStore, Store } from '@reduxjs/toolkit';

import { fireEvent, render } from '@suite-native/test-utils';

import { appGraphReducer } from '../slice';
import { TimeSwitch, timeSwitchItems } from '../components/TimeSwitch';

export const graphStore: Store = configureStore({
    reducer: {
        appGraph: appGraphReducer,
    },
});

test('time switch correctly changes values in redux from component', () => {
    const { getByTestId } = render(
        <Provider store={graphStore}>
            <TimeSwitch />
        </Provider>,
    );

    const all = getByTestId(`TimeSwitchItem_${timeSwitchItems.all.value}`);
    fireEvent.press(all);

    const { selectedTimeFrame } = graphStore.getState().appGraph;
    expect(selectedTimeFrame).toBe(timeSwitchItems.all.value);
});
