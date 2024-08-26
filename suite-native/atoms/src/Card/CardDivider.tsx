import React from 'react';

import { G } from '@mobily/ts-belt';
import { SetRequired } from 'type-fest';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, NativeSpacing } from '@trezor/theme';

import { Divider } from '../Divider';

type CardDividerProps = {
    color?: Color;
    horizontalPadding?: NativeSpacing;
};

const dividerStyle = prepareNativeStyle<SetRequired<CardDividerProps, 'horizontalPadding'>>(
    (utils, { color, horizontalPadding }) => ({
        //  fill the whole width of the parent card
        marginHorizontal: -utils.spacings[horizontalPadding],

        extend: {
            condition: G.isNotNullable(color),
            style: {
                borderBottomColor: utils.colors[color!],
            },
        },
    }),
);

export const CardDivider = ({ color, horizontalPadding = 'medium' }: CardDividerProps) => {
    const { applyStyle } = useNativeStyles();

    return <Divider style={applyStyle(dividerStyle, { color, horizontalPadding })} />;
};
