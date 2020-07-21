import React from 'react';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const DeviceSeedless = () => (
    <DeviceInvalidModeLayout
        data-test="@device-invalid-mode/seedless"
        title={<Translation id="TR_SEEDLESS_MODE" />}
        text={<Translation id="TR_SEEDLESS_MODE_EXPLAINED" />}
        allowSwitchDevice
    />
);

export default DeviceSeedless;
