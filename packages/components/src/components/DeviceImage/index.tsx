/* eslint-disable global-require */
import React from 'react';
import styled from 'styled-components';

export interface DeviceImageProps {
    trezorModel: 1 | 2;
    height?: string | number;
    hires?: boolean;
    className?: string;
}

const Image = styled.img``;

const DeviceImage = ({ trezorModel, height = '100%', hires, className }: DeviceImageProps) => {
    switch (trezorModel) {
        case 1:
            return (
                <Image
                    className={className}
                    height={height}
                    alt="trezor T1"
                    src={
                        hires
                            ? require(`../../images/trezor/T1_hires.png`)
                            : require(`../../images/trezor/T1.png`)
                    }
                    srcSet={
                        hires
                            ? `${require('../../images/trezor/T1_hires.png')} 1x, ${require('../../images/trezor/T1_hires@2x.png')} 2x`
                            : undefined
                    }
                />
            );
        case 2:
            return (
                <Image
                    className={className}
                    height={height}
                    alt="trezor T2"
                    src={
                        hires
                            ? require(`../../images/trezor/T2_hires.png`)
                            : require(`../../images/trezor/T2.png`)
                    }
                    srcSet={
                        hires
                            ? `${require('../../images/trezor/T2_hires.png')} 1x, ${require('../../images/trezor/T2_hires@2x.png')} 2x`
                            : undefined
                    }
                />
            );
        // no default
    }
};

export { DeviceImage };
