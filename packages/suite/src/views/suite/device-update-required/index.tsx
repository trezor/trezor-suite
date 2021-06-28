// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceUpdateRequired

import React from 'react';
import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';

const Index = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <DeviceInvalidModeLayout
            data-test="@device-invalid-mode/update-required"
            title={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
            text={<Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />}
            allowSwitchDevice
            resolveButton={
                <Button onClick={() => goto('firmware-index')}>
                    <Translation id="TR_SEE_DETAILS" />
                </Button>
            }
        />
    );
};

export default Index;
