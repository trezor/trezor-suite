import React from 'react';

import Lottie from 'lottie-react-native';

import { NativeStyleObject } from '@trezor/styles';

import turnOnDeviceLottie from '../assets/turnOnDeviceLottie.json';

type TurnOnDeviceAnimationProps = {
    style?: NativeStyleObject;
};

export const TurnOnDeviceAnimation = ({ style }: TurnOnDeviceAnimationProps) => (
    <Lottie source={turnOnDeviceLottie} autoPlay style={style} loop={false} resizeMode="cover" />
);
