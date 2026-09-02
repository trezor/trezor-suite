import React, { type ReactNode } from 'react';

import { Box, CardDivider, ListItemSkeleton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnListItem } from './EarnListItem';
import { type EarnPromoItem } from '../../types';

const rowContainerStyle = prepareNativeStyle(
    (utils, { isLastInSection }: { isLastInSection: boolean }) => ({
        backgroundColor: utils.colors.surfaceFillRaised,
        borderColor: utils.colors.borderNeutral,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        overflow: 'hidden',
        extend: {
            condition: isLastInSection,
            style: {
                borderBottomWidth: 1,
                borderBottomLeftRadius: utils.borders.radii.r16,
                borderBottomRightRadius: utils.borders.radii.r16,
                marginBottom: utils.spacings.sp24,
            },
        },
    }),
);

type EarnPromoListRowProps = {
    item: EarnPromoItem;
    isLastInSection: boolean;
    onPress: (item: EarnPromoItem) => void;
};

export type EarnPromoListRowContainerProps = {
    children: ReactNode;
    isLastInSection: boolean;
};

export const EarnPromoListRowContainer = ({
    children,
    isLastInSection,
}: EarnPromoListRowContainerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(rowContainerStyle, { isLastInSection })}>
            <CardDivider />
            {children}
        </Box>
    );
};

export const EarnPromoListSkeletonRow = ({
    isLastInSection,
}: Pick<EarnPromoListRowContainerProps, 'isLastInSection'>) => (
    <EarnPromoListRowContainer isLastInSection={isLastInSection}>
        <ListItemSkeleton />
    </EarnPromoListRowContainer>
);

export const EarnPromoListRow = React.memo(
    ({ item, isLastInSection, onPress }: EarnPromoListRowProps) => (
        <EarnPromoListRowContainer isLastInSection={isLastInSection}>
            <EarnListItem {...item} onPress={onPress} />
        </EarnPromoListRowContainer>
    ),
);
