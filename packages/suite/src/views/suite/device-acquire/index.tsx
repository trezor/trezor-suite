// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceAcquire

import React from 'react';
import { useDevice, useActions } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import { Button } from '@trezor/components';
import { Translation, DeviceInvalidModeLayout } from '@suite-components';

const Acquire = () => {
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

export default Acquire;
