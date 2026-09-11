import { TransactionReviewOutputState } from '@suite-common/wallet-types';
import { Box, Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { ReactNode } from 'react';
import { TransactionReviewOutputItemBadge } from './TransactionReviewOutputItemBadge';

const cardStyle = prepareNativeStyle<{ isConfirmed: boolean }>((utils, { isConfirmed }) => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderRadius: utils.borders.radii.r12,
    extend: {
        condition: isConfirmed,
        style: {
            backgroundColor: utils.colors.surfaceFillSunken,
        },
    },
}));

interface TransactionReviewOutputCardProps {
    title: ReactNode;
    children: ReactNode;
    outputState: TransactionReviewOutputState;
}

export const TransactionReviewOutputCard = ({
    title,
    children,
    outputState,
}: TransactionReviewOutputCardProps) => {
    const { applyStyle } = useNativeStyles();

    const isConfirmed = outputState === 'success';

    return (
        <Card style={applyStyle(cardStyle, { isConfirmed })}>
            <VStack spacing="sp12">
                <HStack alignItems="center">
                    <TransactionReviewOutputItemBadge status={outputState} />

                    <Text variant="body-sm-strong" testID="review-output-card/title">
                        {title}
                    </Text>
                </HStack>

                <CardDivider color="borderNeutral" horizontalPadding="sp16" />

                <Box paddingLeft="sp24" testID="review-output-card/content">
                    {children}
                </Box>
            </VStack>
        </Card>
    );
};
