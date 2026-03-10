import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { PressableOpacity, VStack, useBottomSheetModal } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { selectStakedBalanceByAccountKey, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EarnItem } from '../types';
import { EarnItemCardanoInfo } from './EarnItemCardanoInfo';
import { EarnItemInfoModal } from './EarnItemInfoModal';
import { EarnItemOverviewSection } from './EarnItemOverviewSection';
import { EarnItemRewardSection } from './EarnItemRewardSection';

const earnItemStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingVertical: utils.spacings.sp12,
    borderRadius: utils.spacings.sp16,
    marginBottom: utils.spacings.sp16,
    ...utils.boxShadows.small,
}));

export type EarnListItemProps = EarnItem;

export const EarnListItem = (earnItem: EarnListItemProps) => {
    const { accountKey } = earnItem;
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef } = useBottomSheetModal();
    const analytics = useAnalytics();
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>
        >();

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));

    const handlePress = () => {
        analytics.report({ type: events.earnStakeTilePressedEvent.name });
        if (accountKey) {
            navigation.navigate(RootStackRoutes.StakingManagement, { accountKey });
        }
    };

    return (
        <>
            <PressableOpacity style={applyStyle(earnItemStyle)} onPress={handlePress}>
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
