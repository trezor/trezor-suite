import React from 'react';
import { useSelector } from 'react-redux';

import { selectIsBluetoothSupportedByDevice } from '@suite-common/device';
import { LottieAnimation } from '@suite-native/atoms';

import autoEjectCableLottie from '../../../assets/auto-eject-cable-lottie.json';
import autoEjectWirelessLottie from '../../../assets/auto-eject-wireless-lottie.json';

export const AutoEjectAnimation = () => {
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);

    return (
        <LottieAnimation
            source={isBluetoothSupportedByDevice ? autoEjectWirelessLottie : autoEjectCableLottie}
        />
    );
};
