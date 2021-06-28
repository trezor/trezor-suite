// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceInitialize

import React from 'react';
import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';

const DeviceInitialize = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <DeviceInvalidModeLayout
            data-test="@device-invalid-mode/initialize"
            title={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
            text={<Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />}
            resolveButton={
                <Button
                    data-test="@button/go-to-onboarding"
                    onClick={() => goto('onboarding-index')}
                >
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Button>
            }
            allowSwitchDevice
        />
    );
};

export default DeviceInitialize;
