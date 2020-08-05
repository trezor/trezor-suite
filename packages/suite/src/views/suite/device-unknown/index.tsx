import React from 'react';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const DeviceUnknown = () => (
    <DeviceInvalidModeLayout title={<Translation id="TR_UNKNOWN_DEVICE" />} allowSwitchDevice />
);

export default DeviceUnknown;
