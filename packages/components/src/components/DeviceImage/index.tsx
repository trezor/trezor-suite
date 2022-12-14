/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import React from 'react';
import { DeviceModel } from '@trezor/device-utils';

export interface DeviceImageProps {
    deviceModel: DeviceModel;
    height?: string | number;
    hiRes?: boolean;
    className?: string;
}

export const DeviceImage = ({
    deviceModel,
    height = '100%',
    hiRes,
    className,
}: DeviceImageProps) => {
    if (!deviceModel) {
        return null;
    }

    const imagePathBase = `../../images/trezor/T${deviceModel}`;

    return (
        <img
            className={className}
            height={height}
            alt={`Trezor Model ${deviceModel}`}
            src={require(`../../images/trezor/T${deviceModel}${hiRes ? '_hires' : ''}.png`)}
            srcSet={
                hiRes
                    ? `${require(`../../images/trezor/T${deviceModel}_hires.png`)} 1x, ${require(`../../images/trezor/T${deviceModel}_hires@2x.png`)} 2x`
                    : undefined
            }
        />
    );
};
