import { ReactNode } from 'react';
import { View } from 'react-native';

import { G } from '@mobily/ts-belt';
import { RequireAllOrNone } from 'type-fest';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CardStatus, CardStatusProps } from './CardStatus';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
} & RequireAllOrNone<Partial<CardStatusProps>, 'status' | 'statusMessage'>;

type CardStyleProps = {
    isStatusDisplayed: boolean;
};

const cardStyle = prepareNativeStyle<CardStyleProps>((utils, { isStatusDisplayed }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.medium,
    padding: utils.spacings.medium,
    ...utils.boxShadows.small,

    extend: {
        condition: isStatusDisplayed,
        style: {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
        },
    },
}));

export const Card = ({ children, style, status, statusMessage }: CardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View>
            {status && statusMessage && (
                <CardStatus status={status} statusMessage={statusMessage} />
            )}
            <View
                style={[
                    applyStyle(cardStyle, { isStatusDisplayed: G.isNotNullable(status) }),
                    style,
                ]}
            >
                {children}
            </View>
        </View>
    );
};
