import { MouseEventHandler } from 'react';

import { acquireDevice } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import {
    TROUBLESHOOTING_TIP_CLOSE_ALL_TABS,
    TROUBLESHOOTING_TIP_RECONNECT,
} from 'src/components/suite/troubleshooting/tips';
import { useDevice, useDispatch } from 'src/hooks/suite';

export const DeviceTrezorHostProtocolPair = () => {
    const { isLocked, device } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = () => {
        dispatch(acquireDevice({ requestedDevice: device }));
    };

    const ctaButton = (
        <Button data-testid="@device-acquire" isLoading={isDeviceLocked} onClick={handleClick}>
            <Translation id="TR_CONTINUE" />
        </Button>
    );

    const tips = [TROUBLESHOOTING_TIP_CLOSE_ALL_TABS, TROUBLESHOOTING_TIP_RECONNECT];

    return (
        <TroubleshootingTips
            label={<Translation id="TR_NEEDS_TREZOR_HOST_PROTOCOL_PAIRING_DESCRIPTION" />}
            cta={ctaButton}
            items={tips}
        />
    );
};
