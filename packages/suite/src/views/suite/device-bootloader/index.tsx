import React from 'react';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const Index = () => (
    <DeviceInvalidModeLayout
        title={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
        text={<Translation id="TR_DEVICE_IN_BOOTLOADER_EXPLAINED" />}
        allowSwitchDevice
        // no resolve button here. I believe that we don't want to send user anywhere who might have accidentally connected
        // device in bootloader mode
    />
);

export default Index;
