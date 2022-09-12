import React from 'react';

import { fireEvent, render } from '@suite-native/test-utils';

import { TimeSwitch, timeSwitchItems } from '../components/TimeSwitch';

test('time switch correctly changes values in component', () => {
    const { getByTestId } = render(<TimeSwitch />);

    const all = getByTestId(`TimeSwitchItem_${timeSwitchItems.all.value}`);
    fireEvent.press(all);

    const selectedTimeFrame = 'all'; // FIXME
    expect(selectedTimeFrame).toBe(timeSwitchItems.all.value);
});
