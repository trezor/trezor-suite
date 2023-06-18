// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceAcquire

import React from 'react';
import { useDevice, useActions } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { Button } from '@trezor/components';
import { Translation, DeviceInvalidModeLayout } from 'src/components/suite';

export const DeviceAcquire = () => {
    const { device, isLocked } = useDevice();
    const { acquireDevice } = useActions({
        acquireDevice: suiteActions.acquireDevice,
    });

    if (!device) return null;
    return (
        <DeviceInvalidModeLayout
            title={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
            text={<Translation id="TR_ACQUIRE_DEVICE_DESCRIPTION" />}
            image="DEVICE_ANOTHER_SESSION"
            resolveButton={
                <Button isLoading={isLocked()} onClick={() => acquireDevice()}>
                    <Translation id="TR_ACQUIRE_DEVICE" />
                </Button>
            }
        />
    );
};
