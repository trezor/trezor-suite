import React, { useState } from 'react';
import { useDispatch, useDevice } from 'src/hooks/suite';

import { toggleRememberDevice } from 'src/actions/suite/suiteActions';
import { TrezorDevice } from 'src/types/suite';
import { isDeviceRemembered } from 'src/utils/suite/device';
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
