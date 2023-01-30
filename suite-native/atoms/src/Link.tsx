import React from 'react';
import { Linking, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Toast from 'react-native-root-toast'; // TODO: Remove when is our own notification UI ready.

type LinkProps = TouchableOpacityProps & {
    href: string;
};

export const Link = ({ href, ...touchableProps }: LinkProps) => {
    const handleRedirect = async () => {
        try {
            await Linking.openURL(href);
        } catch {
            Toast.show('Unable to open the link.');
        }
    };

    return <TouchableOpacity {...touchableProps} onPress={handleRedirect} />;
};
