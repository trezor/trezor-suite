// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceUnreadable

import React from 'react';
import * as routerActions from 'src/actions/suite/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';

export const DeviceUnreadable = () => {
    const { goto } = useActions({ goto: routerActions.goto });
    return (
        <DeviceInvalidModeLayout
            data-test="@device-invalid-mode/unreadable"
            title={<Translation id="TR_UNREADABLE" />}
            text={<Translation id="TR_UNREADABLE_EXPLAINED" />}
            resolveButton={
                <Button onClick={() => goto('suite-bridge')}>
                    <Translation id="TR_SEE_DETAILS" />
                </Button>
            }
            allowSwitchDevice
        />
    );
};
