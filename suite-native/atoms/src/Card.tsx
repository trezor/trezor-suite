import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
};

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.white,
    borderRadius: 12,
    padding: utils.spacings.medium,
}));

export const Card = ({ children, style }: CardProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={[applyStyle(cardStyle), style]}>{children}</View>;
};
