import React from 'react';

import { Box, CardDivider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnPromoItem } from '../types';
import { EarnListItem } from './EarnListItem';

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

export const EarnPromoListRow = React.memo(
    ({ item, isLastInSection, onPress }: EarnPromoListRowProps) => {
        const { applyStyle } = useNativeStyles();

        return (
            <Box style={applyStyle(rowContainerStyle, { isLastInSection })}>
                <CardDivider />
                <EarnListItem {...item} onPress={onPress} />
            </Box>
        );
    },
);
