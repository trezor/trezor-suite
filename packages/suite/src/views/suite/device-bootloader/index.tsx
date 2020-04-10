import React from 'react';
import { P } from '@trezor/components';
import { DeviceInvalidModeLayout } from '@suite-components';

const Index = () => (
    <DeviceInvalidModeLayout
        title="Device is in bootloader mode"
        text={
            <P data-test="initialize-message">
                In bootloader mode, device is ready to receive firmware updates but it also means
                that nothing else might be done with it. To get back into normal mode simply
                reconnect it.
            </P>
        }
        // no resolve button here. I believe that we don't want to send user anywhere who might have accidentally connected
        // device in bootloader mode
    />
);

export default Index;
