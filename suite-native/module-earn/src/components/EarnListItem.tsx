import { AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import { PressableOpacity, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { useAnalytics } from '@suite-native/services';
import { selectStakedBalanceByAccountKey, useSelector } from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EarnItem } from '../types';
import { EarnItemInfoModal } from './EarnItemInfoModal';
import { EarnItemOverviewSection } from './EarnItemOverviewSection';

const earnItemStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    paddingVertical: utils.spacings.sp12,
    borderRadius: utils.spacings.sp16,
    marginBottom: utils.spacings.sp16,
    ...utils.boxShadows.small,
}));

export type EarnListItemProps = EarnItem;

export const EarnListItem = (earnItem: EarnListItemProps) => {
    const { accountKey, type } = earnItem;
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal } = useBottomSheetModal();
    const analytics = useAnalytics();

    const safeAccountKey = accountKey ?? ('' as AccountKey);
    const stakedBalance = useSelector(state =>
        selectStakedBalanceByAccountKey(state, safeAccountKey),
    );
    const balance = type === 'stablecoin-yield' ? earnItem.tokenBalance : stakedBalance;

    const handlePress = () => {
        openModal();
        analytics.report({
            type:
                type === 'staking'
                    ? events.earnStakeTilePressedEvent.name
                    : events.earnStablecoinYieldTilePressedEvent.name,
        });
    };

    return (
        <>
            <PressableOpacity style={applyStyle(earnItemStyle)} onPress={handlePress}>
                <VStack flex={1}>
                    <EarnItemOverviewSection balance={balance} {...earnItem} />
                </VStack>
            </PressableOpacity>

            <EarnItemInfoModal ref={bottomSheetRef} type={type} />
        </>
    );
};
