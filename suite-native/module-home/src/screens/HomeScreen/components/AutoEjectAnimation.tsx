import React from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceConnectedViaBluetooth } from '@suite-common/wallet-core';
import { LottieAnimation } from '@suite-native/atoms';

import autoEjectCableLottie from '../../../assets/auto-eject-cable-lottie.json';
import autoEjectWirelessLottie from '../../../assets/auto-eject-wireless-lottie.json';

export const AutoEjectAnimation = () => {
    const isDeviceConnectedViaBluetooth = useSelector(selectIsDeviceConnectedViaBluetooth);

    return (
        <LottieAnimation
            source={isDeviceConnectedViaBluetooth ? autoEjectWirelessLottie : autoEjectCableLottie}
        />
    );
};
