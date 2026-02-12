import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { Account } from '@suite-common/wallet-types';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    AppTabsRoutes,
    EarnStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

export const useHandleEarnNavigation = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, any>>();
    const isEarnEnabled = useFeatureFlag(FeatureFlag.IsEarnEnabled);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);

    const isEarnAvailable = isEarnEnabled && !hasBitcoinOnlyFirmware;

    const handleEarnNavigation = (accountKey: Account['key']) => {
        if (isEarnAvailable) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.EarnStack,
                params: {
                    screen: EarnStackRoutes.Earn,
                },
            });
        } else {
            navigation.navigate(RootStackRoutes.StakingDetail, {
                accountKey,
            });
        }
    };

    return { handleEarnNavigation };
};
