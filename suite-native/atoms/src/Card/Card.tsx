import { ReactNode } from 'react';
import { View } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
};

const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.m,
    padding: utils.spacings.m,
    overflow: 'hidden',

    ...utils.boxShadows.s,
}));

export const Card = ({ children, style }: CardProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={[applyStyle(cardStyle), style]}>{children}</View>;
};
