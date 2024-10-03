import { Dimensions } from 'react-native';
import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAIN_ITEM_WIDTH = SCREEN_WIDTH * 0.6;
const TOP_SUB_ITEM_WIDTH = SCREEN_WIDTH * 0.2;
const BOTTOM_SUB_ITEM_WIDTH = SCREEN_WIDTH * 0.25;

export const ListItemSkeleton = () => {
    const {
        applyStyle,
        utils: { borders },
    } = useNativeStyles();

    return (
        <Box style={applyStyle(skeletonContainer)}>
            <BoxSkeleton width={MAIN_ITEM_WIDTH} height={MAIN_ITEM_HEIGHT} />

            <VStack spacing="sp8" alignItems="flex-end">
                <BoxSkeleton
                    width={TOP_SUB_ITEM_WIDTH}
                    height={SUBITEM_HEIGHT}
                    borderRadius={borders.radii.r4}
                />
                <BoxSkeleton
                    width={BOTTOM_SUB_ITEM_WIDTH}
                    height={SUBITEM_HEIGHT}
                    borderRadius={borders.radii.r4}
                />
            </VStack>
        </Box>
    );
};
