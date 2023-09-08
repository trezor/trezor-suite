import { useState } from 'react';

import { toggleRememberDevice } from '@suite-common/wallet-core';
import { isDeviceRemembered } from '@suite-common/suite-utils';

import { useDispatch, useDevice } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { CoinjoinAccountDiscoveryProgress } from 'src/components/wallet';
import { RememberWallet } from './RememberWallet';

export const CoinjoinAccountDiscovery = () => {
    const [shouldRememberCardPersist, setShouldRememberCardPersist] = useState(false);

    const dispatch = useDispatch();

    const { device } = useDevice();

    const deviceRemembered = isDeviceRemembered(device);
    const isRememberVisible = device && (!deviceRemembered || shouldRememberCardPersist);

    const toggleRemember = (device: TrezorDevice) => {
        dispatch(toggleRememberDevice({ device }));
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
