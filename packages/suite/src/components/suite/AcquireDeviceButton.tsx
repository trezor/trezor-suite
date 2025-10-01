import { MouseEventHandler } from 'react';

import { acquireDevice } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

import { useDevice, useDispatch } from 'src/hooks/suite';

import { Translation } from './Translation';

type AcquireButtonProps = {
    className?: string;
    onClick?: MouseEventHandler;
};

export const AcquireDeviceButton = ({ className, onClick }: AcquireButtonProps) => {
    const { isLocked } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        onClick?.(e);
        dispatch(acquireDevice({}));
    };

    return (
        <Banner.Button
            isLoading={isDeviceLocked}
            textWrap={false}
            onClick={handleClick}
            className={className}
        >
            <Translation id="TR_ACQUIRE_DEVICE" />
        </Banner.Button>
    );
};
