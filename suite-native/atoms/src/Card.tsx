import React, { ReactNode } from 'react';
import { View } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
};

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.large / 2,
    padding: utils.spacings.medium,

    ...utils.boxShadows.small,
}));

export const Card = ({ children, style }: CardProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={[applyStyle(cardStyle), style]}>{children}</View>;
};
