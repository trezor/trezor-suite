import { useCallback } from 'react';

import {
    type RouteProp,
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';

import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    type SettingsStackParamList,
    SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { AppCommitHash } from '../components/AppCommitHash';
import { FaqCard } from '../components/FaqCard';
import { LegalSection } from '../components/LegalSection';
import { NeedHelpSection } from '../components/NeedHelpSection';
import { useContactSupportAlert } from '../components/useContactSupportAlert';

type NavigationProp = StackNavigationProps<
    SettingsStackParamList,
    SettingsStackRoutes.SettingsSupport
>;

export const SettingsSupportScreen = () => {
    const route =
        useRoute<RouteProp<SettingsStackParamList, SettingsStackRoutes.SettingsSupport>>();
    const navigation = useNavigation<NavigationProp>();
    const { showContactSupportAlert } = useContactSupportAlert();

    useFocusEffect(
        useCallback(() => {
            const { autoOpenContactSupport, shareSystemInfo } = route.params ?? {};
            if (!autoOpenContactSupport) return;

            // One-shot param: clear immediately to avoid re-triggering on subsequent focus.
            navigation.setParams({
                autoOpenContactSupport: undefined,
                shareSystemInfo: undefined,
            });
            showContactSupportAlert({ initialShareSystemInfo: shareSystemInfo });
        }, [route.params, navigation, showContactSupportAlert]),
    );

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleSettings.items.general.support.title" />}
                />
            }
        >
            <VStack spacing="sp32">
                <FaqCard />
                <NeedHelpSection />
                <AboutUsBanners />
                <LegalSection />
                <AppCommitHash />
            </VStack>
        </Screen>
    );
};
