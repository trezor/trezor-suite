import React from 'react';

import { render } from '@suite-native/test-utils';

import { TimeSwitch } from '../components/TimeSwitch';

test('examples of some things', () => {
    render(<TimeSwitch />);
    expect(2).toEqual(2);
});
