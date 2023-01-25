import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { toggleRememberDevice } from '@suite-actions/suiteActions';
import { useDevice } from '@suite-hooks';
import { TrezorDevice } from '@suite-types';
import { isDeviceRemembered } from '@suite-utils/device';
import { CoinjoinAccountDiscoveryProgress } from './CoinjoinAccountDiscoveryProgress';
import { RememberWallet } from './RememberWallet';

export const CoinjoinAccountDiscovery = () => {
    const [shouldRememberCardPersist, setShouldRememberCardPersist] = useState(false);

    const dispatch = useDispatch();

    const { device } = useDevice();

    const deviceRemembered = isDeviceRemembered(device);
    const isRememberVisible = device && (!deviceRemembered || shouldRememberCardPersist);

    const toggleRemember = (device: TrezorDevice) => {
        dispatch(toggleRememberDevice(device));
        setShouldRememberCardPersist(true);
    };

    return (
        <>
            <CoinjoinAccountDiscoveryProgress />
            {isRememberVisible && (
                <RememberWallet
                    isChecked={deviceRemembered}
                    onChange={() => toggleRemember(device)}
                />
            )}
        </>
    );
};
