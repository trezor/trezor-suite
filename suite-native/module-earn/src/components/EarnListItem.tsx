import { events } from '@suite-native/analytics';
import { PressableOpacity, useBottomSheetModal } from '@suite-native/atoms';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { type EarnPromoItem } from '../types';
import { EarnItemInfoModal } from './EarnItemInfoModal';
import { EarnItemOverviewSection } from './EarnItemOverviewSection';

const promoItemStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    minHeight: 70,
}));

export type EarnListItemProps = EarnPromoItem;

export const EarnListItem = (item: EarnListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal } = useBottomSheetModal();
    const analytics = useAnalytics();

    const handlePress = () => {
        openModal();

        analytics.report({
            type:
                item.type === 'staking'
                    ? events.earnStakeTilePressedEvent.name
                    : events.earnStablecoinYieldTilePressedEvent.name,
        });
    };

    return (
        <>
            <PressableOpacity style={applyStyle(promoItemStyle)} onPress={handlePress}>
                <EarnItemOverviewSection {...item} />
            </PressableOpacity>

            <EarnItemInfoModal ref={bottomSheetRef} type={item.type} />
        </>
    );
};
