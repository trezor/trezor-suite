// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceUnknown

import React from 'react';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const DeviceUnknown = () => (
    <DeviceInvalidModeLayout title={<Translation id="TR_UNKNOWN_DEVICE" />} allowSwitchDevice />
);

export default DeviceUnknown;
