/* eslint-disable global-require */
import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface Props {
    trezorModel: 1 | 2;
    height?: number;
}

const styles = (height: number) =>
    StyleSheet.create({
        image: {
            height,
            resizeMode: 'contain',
        },
    });

const DeviceImage = ({ trezorModel, height = 48 }: Props) => {
    switch (trezorModel) {
        case 1:
            return (
                <Image
                    style={styles(height).image}
                    source={require(`../../images/trezor/T1.png`)}
                />
            );
        case 2:
            return (
                <Image
                    style={styles(height).image}
                    source={require(`../../images/trezor/T2.png`)}
                />
            );
        // no default
    }
};

export { DeviceImage, Props as DeviceImageProps };
