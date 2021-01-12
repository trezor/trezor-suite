import React from 'react';
import { Image, TouchableOpacity } from 'react-native';

/* eslint-disable global-require */

const Header = (props: any) => {
    return (
        <TouchableOpacity onPress={() => props.scene.descriptor.navigation.openDrawer()}>
            <Image style={{ width: 64, height: 64 }} source={require('./menu.png')} />
        </TouchableOpacity>
    );
};

export default Header;
