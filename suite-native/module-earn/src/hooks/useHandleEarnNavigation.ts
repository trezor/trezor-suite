import { useNavigation } from '@react-navigation/native';

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
    const isEearnEnabled = useFeatureFlag(FeatureFlag.IsEarnEnabled);

    const handleEearnNavigation = (accountKey: Account['key']) => {
        if (isEearnEnabled) {
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

    return { handleEearnNavigation };
};
