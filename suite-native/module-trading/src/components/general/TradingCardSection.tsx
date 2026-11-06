import { type ReactNode } from 'react';

import { HStack, VStack } from '@suite-native/atoms';
import { CardTitle } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeSpacing } from '@trezor/theme';

type TradingCardSectionStyleProps = {
    bottomBorder: boolean;
    bottomSpacing: NativeSpacing;
};

const tradingCardSectionStyle = prepareNativeStyle<TradingCardSectionStyleProps>(
    ({ borders, colors, spacings }, { bottomBorder, bottomSpacing }) => ({
        borderBottomWidth: 0,
        borderBottomColor: colors.surfaceBorderRaised,
        paddingHorizontal: spacings.sp20,
        paddingTop: spacings.sp16,
        paddingBottom: spacings[bottomSpacing],
        gap: spacings.sp8,
        extend: [
            {
                condition: bottomBorder,
                style: {
                    borderBottomWidth: borders.widths.small,
                },
            },
        ],
    }),
);

export type TradingCardSectionProps = {
    title?: ReactNode;
    titleAction?: ReactNode;
    bottomBorder?: boolean;
    bottomSpacing?: NativeSpacing;
    testID?: string;
    children: ReactNode;
};

export const TradingCardSection = ({
    title,
    titleAction,
    bottomBorder = false,
    bottomSpacing = 'sp16',
    testID,
    children,
}: TradingCardSectionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack
            style={applyStyle(tradingCardSectionStyle, { bottomBorder, bottomSpacing })}
            testID={testID}
        >
            {title !== undefined && (
                <HStack justifyContent="space-between" alignItems="center">
                    <CardTitle>{title}</CardTitle>
                    {titleAction}
                </HStack>
            )}
            <VStack spacing="sp4">{children}</VStack>
        </VStack>
    );
};
