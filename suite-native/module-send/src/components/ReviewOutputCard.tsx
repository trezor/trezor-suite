import { ReactNode } from 'react';

import { ReviewOutputState } from '@suite-common/wallet-types';
import { Card, VStack, HStack, CardDivider, Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReviewOutputStatusBadge } from './ReviewOutputStatusBadge';

type ReviewOutputCardProps = {
    children: ReactNode;
    title: string;
    outputState: ReviewOutputState;
};

const cardStyle = prepareNativeStyle<{ isConfirmed: boolean }>((utils, { isConfirmed }) => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    marginHorizontal: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderRadius: utils.borders.radii.r12,
    extend: {
        condition: isConfirmed,
        style: {
            backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
            borderColor: utils.colors.borderElevation0,
        },
    },
}));

export const ReviewOutputCard = ({ children, title, outputState }: ReviewOutputCardProps) => {
    const { applyStyle } = useNativeStyles();

    const isConfirmed = outputState === 'success';
    const dividerColor = isConfirmed ? 'borderElevation0' : 'borderElevation1';

    return (
        <Card style={applyStyle(cardStyle, { isConfirmed })}>
            <VStack spacing="sp12">
                <HStack alignItems="center">
                    <ReviewOutputStatusBadge status={outputState} />
                    <Text variant="callout">{title}</Text>
                </HStack>
                <CardDivider color={dividerColor} horizontalPadding="sp16" />
                <Box paddingLeft="sp24">{children}</Box>
            </VStack>
        </Card>
    );
};
