// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceUnknown

import React from 'react';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

export const DeviceUnknown = () => (
    <DeviceInvalidModeLayout title={<Translation id="TR_UNKNOWN_DEVICE" />} allowSwitchDevice />
);
