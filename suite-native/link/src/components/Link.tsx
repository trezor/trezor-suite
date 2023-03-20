import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { useOpenLink } from '../useOpenLink';

type LinkProps = TouchableOpacityProps & {
    href: string;
};

export const Link = ({ href, ...touchableProps }: LinkProps) => {
    const openLink = useOpenLink();
    return <TouchableOpacity {...touchableProps} onPress={() => openLink(href)} />;
};
