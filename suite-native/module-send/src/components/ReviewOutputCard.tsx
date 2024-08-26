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
    marginHorizontal: utils.spacings.small,
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: 12,
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
            <VStack spacing={12}>
                <HStack alignItems="center">
                    <ReviewOutputStatusBadge status={outputState} />
                    <Text variant="callout">{title}</Text>
                </HStack>
                <CardDivider color={dividerColor} horizontalPadding="small" />
                <Box paddingLeft="large" paddingTop="extraSmall">
                    {children}
                </Box>
            </VStack>
        </Card>
    );
};
