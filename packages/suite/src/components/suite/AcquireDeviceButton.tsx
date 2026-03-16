import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { acquireDevice } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

import { useDevice, useDispatch } from 'src/hooks/suite';

type AcquireButtonProps = {
    onClick?: MouseEventHandler;
};

export const AcquireDeviceButton = ({ onClick }: AcquireButtonProps) => {
    const { isLocked } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        onClick?.(e);
        dispatch(acquireDevice({}));
    };

    return (
        <Banner.Button isLoading={isDeviceLocked} onClick={handleClick}>
            <Translation id="TR_ACQUIRE_DEVICE" />
        </Banner.Button>
    );
};
