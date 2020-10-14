import React, { useState } from 'react';
import { Image, ImageProps } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import * as suiteActions from '@suite-actions/suiteActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { isDesktop } from '@suite-utils/env';

const ConnectDeviceImage = (props: Omit<ImageProps, 'image'>) => {
    const [clickCounter, setClickCounter] = useState(0);
    const { bridgeDevMode } = useSelector(state => state.suite.settings.debug);
    const { addToast, setDebugMode } = useActions({
        addToast: notificationActions.addToast,
        setDebugMode: suiteActions.setDebugMode,
    });

    return (
        <Image
            image="CONNECT_DEVICE"
            onClick={() => {
                if (!isDesktop()) {
                    return;
                }

                // same logic as in views/suite/device-connect
                setClickCounter(prev => prev + 1);
                if (clickCounter === 4) {
                    const toggledValue = !bridgeDevMode;
                    setDebugMode({
                        bridgeDevMode: toggledValue,
                    });
                    setClickCounter(0);
                    addToast({
                        type: 'bridge-dev-restart',
                        devMode: toggledValue,
                    });
                }
            }}
            {...props}
        />
    );
};

export default ConnectDeviceImage;
