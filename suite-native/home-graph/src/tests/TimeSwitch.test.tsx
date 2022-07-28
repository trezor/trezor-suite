import React from 'react';

import { store } from '@suite-native/state';
import { fireEvent, render } from '@suite-native/test-utils';

import { TimeSwitch, timeSwitchItems } from '../components/TimeSwitch';

test('time switch correctly changes values in redux from component', () => {
    const { getByTestId } = render(<TimeSwitch />);

    const all = getByTestId(timeSwitchItems.all.value);
    fireEvent.press(all);

    const { selectedTimeFrame } = store.getState().appGraph;
    expect(selectedTimeFrame).toBe(timeSwitchItems.all.value);
});
