import React from 'react';
import { Provider } from 'react-redux';

import { fireEvent, render } from '@suite-native/test-utils';

import { graphStore } from '../slice';
import { TimeSwitch, timeSwitchItems } from '../components/TimeSwitch';

test('time switch correctly changes values in redux from component', () => {
    const { getByTestId } = render(
        <Provider store={graphStore}>
            <TimeSwitch />
        </Provider>,
    );

    const all = getByTestId(timeSwitchItems.all.value);
    fireEvent.press(all);

    const { selectedTimeFrame } = graphStore.getState().appGraph;
    expect(selectedTimeFrame).toBe(timeSwitchItems.all.value);
});
