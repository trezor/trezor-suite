import React, { useState } from 'react';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { DeviceAnimation } from '@trezor/product-components';

export const ConnectBtAnimation = () => {
    const [showLoop, setShowLoop] = useState(false);

    return (
        <>
            {!showLoop && (
                <DeviceAnimation
                    type="CONNECT_BT_INTRO"
                    deviceModelInternal={DEFAULT_FLAGSHIP_MODEL}
                    loop={false}
                    onEnded={() => setShowLoop(true)}
                />
            )}

            {showLoop && (
                <DeviceAnimation
                    type="CONNECT_BT_LOOP"
                    deviceModelInternal={DEFAULT_FLAGSHIP_MODEL}
                    loop
                />
            )}
        </>
    );
};
