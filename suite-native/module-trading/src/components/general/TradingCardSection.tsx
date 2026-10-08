import { type ReactNode } from 'react';

import { HStack, VStack } from '@suite-native/atoms';
import { CardTitle } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TradingCardSectionStyleProps = {
    bottomBorder: boolean;
};

const tradingCardSectionStyle = prepareNativeStyle<TradingCardSectionStyleProps>(
    ({ borders, colors, spacings }, { bottomBorder }) => ({
        borderBottomWidth: 0,
        borderBottomColor: colors.surfaceBorderRaised,
        paddingHorizontal: spacings.sp20,
        paddingTop: spacings.sp12,
        paddingBottom: spacings.sp12,
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
    testID?: string;
    children: ReactNode;
};

export const TradingCardSection = ({
    title,
    titleAction,
    bottomBorder = false,
    testID,
    children,
}: TradingCardSectionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack style={applyStyle(tradingCardSectionStyle, { bottomBorder })} testID={testID}>
            {title !== undefined && (
                <HStack justifyContent="space-between" alignItems="center">
                    <CardTitle>{title}</CardTitle>
                    {titleAction}
                </HStack>
            )}
            <VStack>{children}</VStack>
        </VStack>
    );
};
