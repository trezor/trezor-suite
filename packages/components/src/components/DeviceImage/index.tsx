/* eslint-disable global-require */
import React from 'react';
import styled from 'styled-components';

interface Props {
    trezorModel: 1 | 2;
    height?: string | number;
    className?: string;
}

const Image = styled.img``;

const DeviceImage = ({ trezorModel, height = '100%', className }: Props) => {
    switch (trezorModel) {
        case 1:
            return (
                <Image
                    className={className}
                    height={height}
                    alt="trezor T1"
                    src={require(`../../images/trezor/T1.png`)}
                />
            );
        case 2:
            return (
                <Image
                    className={className}
                    height={height}
                    alt="trezor T2"
                    src={require(`../../images/trezor/T2.png`)}
                />
            );
        // no default
    }
};

export { DeviceImage, Props as DeviceImageProps };
