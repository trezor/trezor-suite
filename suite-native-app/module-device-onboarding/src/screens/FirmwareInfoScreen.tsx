import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import { selectHasDeviceFirmwareInstalled } from '@suite-common/device';
import { useDeviceLowBatteryAlert } from '@suite-native/device';
import { FirmwareInfoScreenContent, FirmwareInfoScreenFooter } from '@suite-native/firmware';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useExitAlert } from '../hooks/useExitAlert';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.FirmwareInfo,
    RootStackParamList
>;

export const FirmwareInfoScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const { showLowBatteryAlertIfNecessary } = useDeviceLowBatteryAlert();
    const { handleExitButtonPress } = useExitAlert();

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
                    onCancel={handleExitButtonPress}
                />
            }
        >
            <FirmwareInfoScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
