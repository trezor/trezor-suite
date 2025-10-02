import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import { selectHasDeviceFirmwareInstalled } from '@suite-common/wallet-core';
import { useDeviceLowBatteryAlert } from '@suite-native/device';
import { FirmwareInfoScreenContent, FirmwareInfoScreenFooter } from '@suite-native/firmware';
import { Translation, TxKeyPath } from '@suite-native/intl';
import {
    AppTabsRoutes,
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.FirmwareInfo,
    RootStackParamList
>;

export const FirmwareInfoScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const { showLowBatteryAlertIfNecessary } = useDeviceLowBatteryAlert();

    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const handleUpdateConfirmation = () => {
        if (showLowBatteryAlertIfNecessary()) {
            return;
        }
        updateOnboardingAnalytics({
            firmware: hasDeviceFirmwareInstalled ? 'update' : 'install',
        });
        navigation.replace(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    const handleCancel = () => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    const screenTitleTranslationId: TxKeyPath = hasDeviceFirmwareInstalled
        ? 'firmware.firmwareInfoScreen.title.update'
        : 'firmware.firmwareInfoScreen.title.install';

    return (
        <DeviceOnboardingScreenWithExitButton
            screenHeaderTitle={<Translation id={screenTitleTranslationId} />}
            screenHeaderSubtitle={<Translation id="firmware.firmwareInfoScreen.subtitle" />}
            footer={
                <FirmwareInfoScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                    onCancel={handleCancel}
                />
            }
        >
            <FirmwareInfoScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
