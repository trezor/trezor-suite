// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceBootloader

import React from 'react';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const Index = () => {
    const actions = useActions({
        goto: routerActions.goto,
    });
    return (
        <DeviceInvalidModeLayout
            data-test="@device-invalid-mode/bootloader"
            title={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
            text={<Translation id="TR_DEVICE_IN_BOOTLOADER_EXPLAINED" />}
            allowSwitchDevice
            resolveButton={
                <Button
                    onClick={() => {
                        actions.goto('firmware-index');
                    }}
                >
                    <Translation id="TR_GO_TO_FIRMWARE" />
                </Button>
            }
        />
    );
};

export default Index;
