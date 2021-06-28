// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceNoFirmware

import React from 'react';
import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';

const Index = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <DeviceInvalidModeLayout
            title={<Translation id="TR_NO_FIRMWARE" />}
            text={<Translation id="TR_NO_FIRMWARE_EXPLAINED" />}
            resolveButton={
                <Button onClick={() => goto('onboarding-index')}>
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Button>
            }
            allowSwitchDevice
        />
    );
};

export default Index;
