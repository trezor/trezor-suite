/* @flow */

import debugLink from './debugLink';
import getFeatures from './getFeatures';
import resetDevice from './resetDevice';
import wipeDevice from './wipeDevice';

export default [
    ...debugLink,
    ...getFeatures,
    ...resetDevice,
    ...wipeDevice
]