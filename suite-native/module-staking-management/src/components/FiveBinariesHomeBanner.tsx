import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { selectFirstCardanoAccountStakedWithFiveBinaries } from '@suite-native/staking/src/cardanoStakingSelectors';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const FiveBinariesHomeBanner = () => {
    const navigation = useNavigation<NavigationProp>();

    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectFirstCardanoAccountStakedWithFiveBinaries(state),
    );

    if (!account) return null;

    const handleButtonPress = () => {
        navigation.navigate(RootStackRoutes.StakingDetail, {
            accountKey: account.key,
        });
    };

    return (
        <InlineAlertBox
            variant="warning"
            title={<Translation id="staking.infoBanner.rewardsReduced" />}
            buttonLabel={<Translation id="generic.buttons.learnMore" />}
            onButtonPress={handleButtonPress}
        />
    );
};
