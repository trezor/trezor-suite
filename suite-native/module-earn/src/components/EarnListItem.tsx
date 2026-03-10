import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { PressableOpacity, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { SUITE_URL } from '@trezor/urls';

import { EarnItemCardanoInfo } from './EarnItemCardanoInfo';
import { EarnItemOverviewSection } from './EarnItemOverviewSection';
import { EarnItemRewardSection } from './EarnItemRewardSection';
import { StakingUnavailableBottomSheet } from './StakingUnavailableBottomSheet';
import { type EarnPromoItem } from '../types';

const promoItemStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    minHeight: 70,
}));

type EarnListItemProps = EarnPromoItem & {
    onPress: (type: EarnPromoItem['type']) => void;
};

export const EarnListItem = (earnItem: EarnListItemProps) => {
    const { onPress, type, accountKey } = earnItem;
    const { applyStyle } = useNativeStyles();

    const analytics = useAnalytics();
    const openLink = useOpenLink();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const navigation =
        useNavigation<
            StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>
        >();

    const handlePress = () => {
        onPress(type);
        analytics.report({ type: events.earnStakeTilePressedEvent.name });
        if (accountKey) {
            navigation.navigate(RootStackRoutes.StakingManagement, { accountKey });
        } else {
            openModal();
        }
    };

    return (
        <>
            <PressableOpacity style={applyStyle(promoItemStyle)} onPress={handlePress}>
                <VStack flex={1}>
                    <EarnItemOverviewSection {...earnItem} />
                    {accountKey && earnItem.type === 'staking' && (
                        <>
                            <EarnItemRewardSection {...earnItem} />
                            <EarnItemCardanoInfo {...earnItem} />
                        </>
                    )}
                </VStack>
            </PressableOpacity>
            <StakingUnavailableBottomSheet
                ref={bottomSheetRef}
                onClose={closeModal}
                handleDesktopClick={() => openLink(SUITE_URL)}
            />
        </>
    );
};
