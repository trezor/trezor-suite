import React, { ReactNode } from 'react';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color, nativeSpacings } from '@trezor/theme';
import { Box, Divider } from '@suite-native/atoms';

import { ScreenContent } from './ScreenContent';

type ScreenProps = {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    hasDivider?: boolean;
    hasStatusBar?: boolean;
    isScrollable?: boolean;
    backgroundColor?: Color;
    customVerticalPadding?: number;
    customHorizontalPadding?: number;
};

const screenContainerStyle = prepareNativeStyle<{
    backgroundColor: Color;
}>((utils, { backgroundColor }) => ({
    flex: 1,
    backgroundColor: utils.colors[backgroundColor],
}));

const screenHeaderStyle = prepareNativeStyle<{
    insets: EdgeInsets;
    customHorizontalPadding: number;
    customVerticalPadding: number;
}>((_, { insets, customHorizontalPadding, customVerticalPadding }) => {
    const { top, right, left } = insets;
    return {
        paddingTop: Math.max(top, customVerticalPadding),
        paddingLeft: Math.max(left, customHorizontalPadding),
        paddingRight: Math.max(right, customHorizontalPadding),
    };
});

export const Screen = ({
    children,
    header,
    footer,
    hasDivider = false,
    isScrollable = true,
    hasStatusBar = true,
    backgroundColor = 'gray100',
    customVerticalPadding = nativeSpacings.medium,
    customHorizontalPadding = nativeSpacings.medium,
}: ScreenProps) => {
    const {
        applyStyle,
        utils: { colors, isDarkColor },
    } = useNativeStyles();
    const insets = useSafeAreaInsets();
    const barStyle = isDarkColor(colors[backgroundColor]) ? 'light-content' : 'dark-content';

    return (
        <View
            style={applyStyle(screenContainerStyle, {
                backgroundColor,
            })}
        >
            <StatusBar
                barStyle={barStyle}
                hidden={!hasStatusBar}
                translucent={false}
                backgroundColor={colors[backgroundColor]}
            />
            {header && (
                <View>
                    <View
                        style={[
                            applyStyle(screenHeaderStyle, {
                                insets,
                                customHorizontalPadding,
                                customVerticalPadding,
                            }),
                        ]}
                    >
                        {header}
                    </View>
                    {hasDivider && (
                        <Box marginTop="small">
                            <Divider />
                        </Box>
                    )}
                </View>
            )}
            <ScreenContent
                footer={footer}
                isScrollable={isScrollable}
                customVerticalPadding={customVerticalPadding}
                customHorizontalPadding={customHorizontalPadding}
            >
                {children}
            </ScreenContent>
        </View>
    );
};
