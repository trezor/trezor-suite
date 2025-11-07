import { useEffect, useRef, useState } from 'react';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { DeviceAnimation } from '@trezor/product-components';

import { AnimationCard } from './AnimationCard';

type CableConnectionAnimationProps = {
    isBluetoothMode: boolean;
};

export const CableConnectionAnimation = ({
    isBluetoothMode: isBluetooth,
}: CableConnectionAnimationProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showLoop, setShowLoop] = useState(false);

    // isBluetooth used so that animation is triggered when toggling between modes
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.play();
            }
        }, 1500);

        return () => {
            clearTimeout(timeout);
        };
    }, [isBluetooth]);

    const bluetoothAnimation = showLoop ? (
        <DeviceAnimation type="CONNECT_BT_LOOP" deviceModelInternal={DEFAULT_FLAGSHIP_MODEL} loop />
    ) : (
        <DeviceAnimation
            type="CONNECT_BT_INTRO"
            deviceModelInternal={DEFAULT_FLAGSHIP_MODEL}
            loop={false}
            autoPlay={false}
            ref={videoRef}
            onEnded={() => setShowLoop(true)}
        />
    );

    return (
        // The magic numbers are intentional. Used for proper scaling.
        <AnimationCard aspectRatio="752 / 1000" maxHeight="52vh">
            {isBluetooth ? (
                bluetoothAnimation
            ) : (
                <DeviceAnimation
                    type="CONNECT_CABLE"
                    deviceModelInternal={DEFAULT_FLAGSHIP_MODEL}
                    autoPlay={false}
                    ref={videoRef}
                />
            )}
        </AnimationCard>
    );
};
