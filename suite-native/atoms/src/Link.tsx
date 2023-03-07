import React from 'react';
import { Linking, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Toast from 'react-native-root-toast'; // TODO: Remove when is our own notification UI ready.

type LinkProps = TouchableOpacityProps & {
    href: string;
};

export const handleRedirect = async (href: string) => {
    try {
        await Linking.openURL(href);
    } catch {
        Toast.show('Unable to open the link.');
    }
};

export const Link = ({ href, ...touchableProps }: LinkProps) => (
    <TouchableOpacity {...touchableProps} onPress={() => handleRedirect(href)} />
);
