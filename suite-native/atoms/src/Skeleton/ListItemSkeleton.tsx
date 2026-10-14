import React from 'react';
import { useWindowDimensions } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { BoxSkeleton } from './BoxSkeleton';
import { VStack } from '../Stack';

const skeletonContainer = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
}));

const MAIN_ITEM_HEIGHT = 48;
const SUBITEM_HEIGHT = 20;

const MAIN_ITEM_WIDTH_RATIO = 0.6;
const TOP_SUB_ITEM_WIDTH_RATIO = 0.2;
const BOTTOM_SUB_ITEM_WIDTH_RATIO = 0.25;

export const ListItemSkeleton = () => {
    const {
        applyStyle,
        utils: { borders },
    } = useNativeStyles();
    const { width: windowWidth } = useWindowDimensions();

    return (
        <Box style={applyStyle(skeletonContainer)}>
            <BoxSkeleton width={windowWidth * MAIN_ITEM_WIDTH_RATIO} height={MAIN_ITEM_HEIGHT} />

            <VStack spacing="sp8" alignItems="flex-end">
                <BoxSkeleton
                    width={windowWidth * TOP_SUB_ITEM_WIDTH_RATIO}
                    height={SUBITEM_HEIGHT}
                    borderRadius={borders.radii.r4}
                />
                <BoxSkeleton
                    width={windowWidth * BOTTOM_SUB_ITEM_WIDTH_RATIO}
                    height={SUBITEM_HEIGHT}
                    borderRadius={borders.radii.r4}
                />
            </VStack>
        </Box>
    );
};
