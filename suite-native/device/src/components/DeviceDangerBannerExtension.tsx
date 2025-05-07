import { useNavigation } from '@react-navigation/native';
import { useAtomValue } from 'jotai';

import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    DeviceOnboardingStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL } from '@trezor/urls';

import { DeviceDangerBannerCause, deviceDangerBannerAtom } from '../deviceAtoms';

export const bannerContentPresets = {
    'device-compromised': {
        title: 'generic.banners.deviceDanger.compromised.title',
        subtitle: 'generic.banners.deviceDanger.compromised.subtitle',
        cta: 'generic.banners.deviceDanger.compromised.cta',
    },
    'backup-failed': {
        title: 'generic.banners.deviceDanger.backupFailed.title',
        subtitle: 'generic.banners.deviceDanger.backupFailed.subtitle',
        cta: 'generic.banners.deviceDanger.backupFailed.cta',
    },
    'backup-needed': {
        title: 'generic.banners.deviceDanger.backupNeeded.title',
        subtitle: 'generic.banners.deviceDanger.backupNeeded.subtitle',
        cta: 'generic.banners.deviceDanger.backupNeeded.cta',
    },
} as const satisfies Record<
    DeviceDangerBannerCause,
    {
        title: TxKeyPath;
        subtitle: TxKeyPath;
        cta: TxKeyPath;
    }
>;

type NavigationProps = TabToStackCompositeNavigationProp<
    RootStackParamList,
    HomeStackRoutes,
    HomeStackParamList
>;

export const DeviceDangerBannerExtension = () => {
    const navigation = useNavigation<NavigationProps>();
    const openLink = useOpenLink();
    const deviceDanger = useAtomValue(deviceDangerBannerAtom);
    const { cause } = deviceDanger ?? {};

    const handleCtaPress = () => {
        if (cause === 'device-compromised') {
            openLink(TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_MOBILE_URL);
        }
        if (cause === 'backup-needed') {
            navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.WalletBackupTutorial,
            });
        }
        if (cause === 'backup-failed') {
            navigation.navigate(RootStackRoutes.BackupFailedModal);
        }
    };

    if (!cause) return null;

    const { subtitle, cta } = bannerContentPresets[cause];

    return (
        <VStack spacing="sp16">
            <Text textAlign="center">
                <Translation id={subtitle} />
            </Text>
            <Button colorScheme="redBold" onPress={handleCtaPress}>
                <Translation id={cta} />
            </Button>
        </VStack>
    );
};
