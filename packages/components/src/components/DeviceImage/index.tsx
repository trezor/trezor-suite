/* eslint-disable global-require */
import React from 'react';
import styled from 'styled-components';

interface Props {
    trezorModel: 'T1' | 'T2';
    className: string;
}

const Image = styled.img``;

const DeviceImage = ({ trezorModel, className }: Props) => {
    switch (trezorModel) {
        case 'T1':
            return (
                <Image
                    className={className}
                    alt="trezor T1"
                    src={require(`../../images/trezor/T1.png`)}
                />
            );
        case 'T2':
            return (
                <Image
                    className={className}
                    alt="trezor T2"
                    src={require(`../../images/trezor/T2.png`)}
                />
            );
        // no default
    }
};

export default DeviceImage;
