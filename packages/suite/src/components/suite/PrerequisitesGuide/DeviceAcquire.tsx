import { MouseEventHandler } from 'react';

import { acquireDevice } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import {
    TROUBLESHOOTING_TIP_RECONNECT,
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
} from 'src/components/suite/troubleshooting/tips';

export const DeviceAcquire = () => {
    const { isLocked } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(acquireDevice());
    };

    const ctaButton = (
        <Button data-testid="@device-acquire" isLoading={isDeviceLocked} onClick={handleClick}>
            <Translation id="TR_TRY_AGAIN" />
        </Button>
    );

    const tips = [TROUBLESHOOTING_TIP_CLOSE_ALL_TABS, TROUBLESHOOTING_TIP_RECONNECT];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_NEEDS_ATTENTION_UNABLE_TO_CONNECT" />}
            cta={ctaButton}
            items={tips}
        />
    );
};
