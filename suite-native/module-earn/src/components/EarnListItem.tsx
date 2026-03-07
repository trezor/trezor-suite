import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { PressableOpacity, VStack } from '@suite-native/atoms';
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
    const { accountKey, symbol } = earnItem;
    const { applyStyle } = useNativeStyles();
    const analytics = useAnalytics();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));

    const handlePress = () => {
        navigation.navigate(RootStackRoutes.HowStakeWorksScreen, {
            accountKey,
            symbol,
        });
        analytics.report({ type: events.earnStakeTilePressedEvent.name });
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
        </>
    );
};
