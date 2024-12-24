import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useAtomValue } from 'jotai';

import {
    SettingsStackRoutes,
    RootStackRoutes,
    StackNavigationProps,
    RootStackParamList,
} from '@suite-native/navigation';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';
import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';
import { isDevButtonVisibleAtom } from './ProductionDebug';

export const FeaturesSettings = () => {
    const isDevButtonVisible = useAtomValue(isDevButtonVisibleAtom);
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const navigateTo = useSettingsNavigateTo();

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);

    return (
        <SettingsSection title={<Translation id="moduleSettings.items.features.title" />}>
            {isDevButtonVisible && (
                <SettingsSectionItem
                    iconName="circleDashed"
                    title={<Translation id="moduleSettings.items.features.devUtils.title" />}
                    subtitle={<Translation id="moduleSettings.items.features.devUtils.subtitle" />}
                    onPress={() => navigation.navigate(RootStackRoutes.DevUtilsStack)}
                    testID="@settings/dev-utils"
                />
            )}
            <SettingsSectionItem
                iconName="eye"
                title={<Translation id="moduleSettings.items.features.privacyAndSecurity.title" />}
                subtitle={
                    <Translation id="moduleSettings.items.features.privacyAndSecurity.subtitle" />
                }
                onPress={() => navigateTo(SettingsStackRoutes.SettingsPrivacyAndSecurity)}
                testID="@settings/privacy-and-security"
            />
            {isUsbDeviceConnectFeatureEnabled && (
                <>
                    <SettingsSectionItem
                        iconName="bookmarkSimple"
                        title={<Translation id="moduleSettings.items.features.viewOnly.title" />}
                        subtitle={
                            <Translation id="moduleSettings.items.features.viewOnly.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsViewOnly)}
                        testID="@settings/view-only"
                    />
                    <SettingsSectionItem
                        iconName="coins"
                        title={
                            <Translation id="moduleSettings.items.features.coinEnabling.title" />
                        }
                        subtitle={
                            <Translation id="moduleSettings.items.features.coinEnabling.subtitle" />
                        }
                        onPress={() => navigateTo(SettingsStackRoutes.SettingsCoinEnabling)}
                        isLoading={hasDiscovery}
                        testID="@settings/coin-enabling"
                    />
                </>
            )}
        </SettingsSection>
    );
};
