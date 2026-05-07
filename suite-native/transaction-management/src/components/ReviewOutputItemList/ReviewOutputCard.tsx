import { type ReactNode } from 'react';

import { type ReviewOutputState } from '@suite-common/wallet-types';
import { Box, Card, CardDivider, HStack, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ReviewOutputStatusBadge } from './ReviewOutputStatusBadge';

type ReviewOutputCardProps = {
    children: ReactNode;
    title: ReactNode;
    outputState: ReviewOutputState;
};

const REVIEW_OUTPUT_CARD_TEST_ID = 'review-output-card';

const cardStyle = prepareNativeStyle<{ isConfirmed: boolean }>((utils, { isConfirmed }) => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderRadius: utils.borders.radii.r12,
    extend: {
        condition: isConfirmed,
        style: {
            backgroundColor: utils.colors.legacyBackgroundTertiaryDefaultOnElevation1,
        },
    },
}));

export const ReviewOutputCard = ({ children, title, outputState }: ReviewOutputCardProps) => {
    const { applyStyle } = useNativeStyles();

    const isConfirmed = outputState === 'success';

    return (
        <Card style={applyStyle(cardStyle, { isConfirmed })}>
            <VStack spacing="sp12">
                <HStack alignItems="center">
                    <ReviewOutputStatusBadge status={outputState} />
                    <Text variant="body-sm-strong" testID={REVIEW_OUTPUT_CARD_TEST_ID + '/title'}>
                        {title}
                    </Text>
                </HStack>
                <CardDivider color="borderNeutral" horizontalPadding="sp16" />
                <Box paddingLeft="sp24" testID={REVIEW_OUTPUT_CARD_TEST_ID + '/content'}>
                    {children}
                </Box>
            </VStack>
        </Card>
    );
};
