import React from 'react';

import { Box, CardDivider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnPromoItem } from '../types';
import { EarnListItem } from './EarnListItem';

const rowContainerStyle = prepareNativeStyle(
    (utils, { isLastInSection }: { isLastInSection: boolean }) => ({
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        borderColor: utils.colors.borderElevation1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: isLastInSection ? 1 : 0,
        borderBottomLeftRadius: isLastInSection ? utils.borders.radii.r16 : 0,
        borderBottomRightRadius: isLastInSection ? utils.borders.radii.r16 : 0,
        marginBottom: isLastInSection ? utils.spacings.sp24 : 0,
        overflow: 'hidden',
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
