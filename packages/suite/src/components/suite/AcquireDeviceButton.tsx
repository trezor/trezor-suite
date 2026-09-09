import { type MouseEventHandler } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { acquireDeviceThunk } from '@suite-common/device';
import { selectDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';

type AcquireButtonProps = {
    onClick?: MouseEventHandler;
};

export const AcquireDeviceButton = ({ onClick }: AcquireButtonProps) => {
    const { isLocked } = useDevice();
    const { dispatch } = useServices(selectDispatch);

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
