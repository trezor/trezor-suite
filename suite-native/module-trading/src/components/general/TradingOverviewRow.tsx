import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type TradeOverviewOptionProps = {
    title: string;
    children: ReactNode;
    onPress?: () => void;
    noBottomBorder?: boolean;
};

const pressableStyle = prepareNativeStyle<{ noBottomBorder: boolean }>(
    ({ borders, colors }, { noBottomBorder }) => ({
        extend: [
            {
                condition: !noBottomBorder,
                style: {
                    borderBottomWidth: borders.widths.small,
                    borderBottomColor: colors.backgroundSurfaceElevation0,
                },
            },
        ],
    }),
);

export const TradingOverviewRow = ({
    title,
    children,
    onPress,
    noBottomBorder = false,
}: TradeOverviewOptionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable
            onPress={onPress}
            accessible={true}
            accessibilityLabel={title}
            accessibilityRole="button"
            style={applyStyle(pressableStyle, { noBottomBorder })}
        >
            <HStack paddingHorizontal="sp20" justifyContent="space-between">
                <Box paddingVertical="sp20">
                    <Text color="textDefault" variant="body">
                        {title}
                    </Text>
                </Box>
                <HStack flex={1} justifyContent="flex-end" alignItems="center">
                    {children}
                    <Icon name="caretDown" size="medium" color="textSubdued" />
                </HStack>
            </HStack>
        </Pressable>
    );
};
