import { useCallback } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/device';
import { FullAlertBox } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useNativeServices } from '@suite-native/services';

import { selectShouldDisplaySuiteSyncAlert } from '../homescreenSelectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const SuiteSyncKeysAlert = () => {
    const { translate } = useTranslate();
    const { suiteSync } = useNativeServices();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const navigation = useNavigation<NavigationProp>();

    const allowSuiteSyncForWallet = useCallback(async () => {
        if (!deviceStaticSessionId) return;

        if (!isDeviceConnected) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            });
        } else {
            await suiteSync.ensureWalletSuiteSyncOn({
                deviceStaticSessionId,
                isWriteMode: false,
            });
        }
    }, [deviceStaticSessionId, isDeviceConnected, navigation, suiteSync]);

    if (!shouldDisplaySuiteSyncAlert) return null;

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <FullAlertBox
                variant="info"
                title={translate('moduleHome.suiteSyncAlert.title')}
                description={translate('moduleHome.suiteSyncAlert.description')}
                primaryButtonLabel={translate('moduleHome.suiteSyncAlert.button')}
                onPressPrimaryButton={allowSuiteSyncForWallet}
                marginHorizontal="sp16"
            />
        </Animated.View>
    );
};
