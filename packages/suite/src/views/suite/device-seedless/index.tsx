import React from 'react';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

export default () => (
    <DeviceInvalidModeLayout
        title={<Translation id="TR_SEEDLESS_MODE" />}
        text={<Translation id="TR_SEEDLESS_MODE_EXPLAINED" />}
        allowSwitchDevice
    />
);
