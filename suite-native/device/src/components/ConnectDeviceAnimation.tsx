import React from 'react';

import Lottie from 'lottie-react-native';

import { NativeStyleObject } from '@trezor/styles';

import connectDeviceLottie from '../assets/connectDeviceLottie.json';

type ConnectDeviceAnimationProps = {
    style?: NativeStyleObject;
};

export const ConnectDeviceAnimation = ({ style }: ConnectDeviceAnimationProps) => (
    <Lottie source={connectDeviceLottie} autoPlay style={style} loop={false} resizeMode="cover" />
);
