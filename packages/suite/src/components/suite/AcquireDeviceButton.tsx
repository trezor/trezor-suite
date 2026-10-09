import { type MouseEventHandler } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { acquireDeviceThunk } from '@suite-common/device';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type AcquireButtonProps = {
    onClick?: MouseEventHandler;
};

export const AcquireDeviceButton = ({ onClick }: AcquireButtonProps) => {
    const { isLocked } = useDevice();
    const { dispatch } = useServices(injectDispatch);

    const isDeviceLocked = isLocked();

    const handleClick: MouseEventHandler = e => {
        onClick?.(e);
        dispatch(acquireDeviceThunk({}));
    };

    return (
        <Banner.Button isLoading={isDeviceLocked} onClick={handleClick}>
            <Translation id="TR_ACQUIRE_DEVICE" />
        </Banner.Button>
    );
};
