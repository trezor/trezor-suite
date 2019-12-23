import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { HeaderBackButtonProps } from 'react-navigation-stack';

/* eslint-disable global-require */

export default (props: HeaderBackButtonProps) => {
    return (
        <TouchableOpacity onPress={() => props.scene.descriptor.navigation.openDrawer()}>
            <Image style={{ width: 64, height: 64 }} source={require('./menu.png')} />
        </TouchableOpacity>
    );
};
