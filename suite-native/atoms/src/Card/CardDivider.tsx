import { type SetRequired } from 'type-fest';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeSpacing } from '@trezor/theme';
import { isNotNullOrUndefined } from '@trezor/utils';

import { Divider } from '../Divider';

type CardDividerProps = {
    color?: Color;
    horizontalPadding?: NativeSpacing | 0;
};

const dividerStyle = prepareNativeStyle<SetRequired<CardDividerProps, 'horizontalPadding'>>(
    (utils, { color, horizontalPadding }) => ({
        //  fill the whole width of the parent card
        marginHorizontal: horizontalPadding === 0 ? 0 : -utils.spacings[horizontalPadding],

        extend: {
            condition: isNotNullOrUndefined(color),
            style: {
                borderBottomColor: utils.colors[color!],
            },
        },
    }),
);

export const CardDivider = ({ color, horizontalPadding = 'sp16' }: CardDividerProps) => {
    const { applyStyle } = useNativeStyles();

    return <Divider style={applyStyle(dividerStyle, { color, horizontalPadding })} />;
};
