import { type ReactNode } from 'react';

import { HStack, VStack } from '@suite-native/atoms';
import { CardTitle } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TradingCardSectionStyleProps = {
    bottomBorder: boolean;
    readOnly: boolean;
};

const tradingCardSectionStyle = prepareNativeStyle<TradingCardSectionStyleProps>(
    ({ borders, colors, spacings }, { bottomBorder, readOnly }) => ({
        borderBottomWidth: 0,
        borderBottomColor: colors.surfaceBorderRaised,
        paddingHorizontal: spacings.sp12,
        paddingTop: spacings.sp12,
        paddingBottom: spacings.sp12,
        gap: spacings.sp4,
        extend: [
            {
                condition: bottomBorder,
                style: {
                    borderBottomWidth: borders.widths.small,
                },
            },
            {
                condition: readOnly,
                style: {
                    borderColor: colors.surfaceBorderRaised,
                    backgroundColor: colors.surfaceFillPage,
                    borderBottomLeftRadius: borders.radii.r16,
                    borderBottomRightRadius: borders.radii.r16,
                    borderTopWidth: 0,
                    borderWidth: borders.widths.small,
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
    readOnly?: boolean;
    testID?: string;
    children: ReactNode;
};

export const TradingCardSection = ({
    title,
    titleAction,
    bottomBorder = false,
    readOnly = false,
    testID,
    children,
}: TradingCardSectionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack
            style={applyStyle(tradingCardSectionStyle, { bottomBorder, readOnly })}
            testID={testID}
        >
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
