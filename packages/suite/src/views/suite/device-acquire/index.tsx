import React from 'react';

import { SUITE } from '@suite-actions/constants';
import { Button } from '@trezor/components';
import { Translation, DeviceInvalidModeLayout } from '@suite-components';

import { Props } from './Container';

const Acquire = ({ device, locks, acquireDevice }: Props) => {
    if (!device) return null;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <DeviceInvalidModeLayout
            title={<Translation id="TR_ACQUIRE_DEVICE_TITLE" />}
            text={<Translation id="TR_ACQUIRE_DEVICE_DESCRIPTION" />}
            image="DEVICE_ANOTHER_SESSION"
            resolveButton={
                <Button isLoading={locked} onClick={() => acquireDevice()}>
                    <Translation id="TR_ACQUIRE_DEVICE" />
                </Button>
            }
        />
    );
};

export default Acquire;
