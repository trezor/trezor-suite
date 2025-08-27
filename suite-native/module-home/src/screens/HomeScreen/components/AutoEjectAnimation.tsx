import React from 'react';
import { useSelector } from 'react-redux';

import { selectIsBluetoothDevice } from '@suite-common/wallet-core';
import { LottieAnimation } from '@suite-native/atoms';

import autoEjectCableLottie from '../../../assets/auto-eject-cable-lottie.json';
import autoEjectWirelessLottie from '../../../assets/auto-eject-wireless-lottie.json';

export const AutoEjectAnimation = () => {
    const isBluetoothDevice = useSelector(selectIsBluetoothDevice);

    return (
        <LottieAnimation
            source={isBluetoothDevice ? autoEjectWirelessLottie : autoEjectCableLottie}
        />
    );
};
