import React from 'react';
import { useSelector } from 'react-redux';

import { PressableOpacity, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { NativeStakingRootState, selectStakedBalanceByAccountKey } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EarnItemCardanoInfo } from './EarnItemCardanoInfo';
import { EarnItemInfoModal } from './EarnItemInfoModal';
import { EarnItemOverviewSection } from './EarnItemOverviewSection';
import { EarnItemRewardSection } from './EarnItemRewardSection';
import { EarnItem } from '../screens/EarnScreen';

const earnItemStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingVertical: utils.spacings.sp12,
    borderRadius: utils.spacings.sp16,
    marginBottom: utils.spacings.sp16,
    ...utils.boxShadows.small,
}));

export const EarnListItem = (earnItem: EarnItem) => {
    const { accountKey } = earnItem;
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal } = useBottomSheetModal();

    const stakedBalance = useSelector((state: NativeStakingRootState) =>
        selectStakedBalanceByAccountKey(state, accountKey),
    );

    return (
        <>
            <PressableOpacity style={applyStyle(earnItemStyle)} onPress={openModal}>
                <VStack flex={1}>
                    <EarnItemOverviewSection stakedBalance={stakedBalance} {...earnItem} />
                    {accountKey && (
                        <>
                            <EarnItemRewardSection {...earnItem} />
                            <EarnItemCardanoInfo {...earnItem} />
                        </>
                    )}
                </VStack>
            </PressableOpacity>

            <EarnItemInfoModal ref={bottomSheetRef} />
        </>
    );
};
