import { useEffect, useRef } from 'react';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    type SettingsStackParamList,
    type SettingsStackRoutes,
} from '@suite-native/navigation';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { AppCommitHash } from '../components/AppCommitHash';
import { FaqCard } from '../components/FaqCard';
import { LegalSection } from '../components/LegalSection';
import { NeedHelpSection } from '../components/NeedHelpSection';
import { useContactSupportAlert } from '../components/useContactSupportAlert';

export const SettingsSupportScreen = () => {
    const route =
        useRoute<RouteProp<SettingsStackParamList, SettingsStackRoutes.SettingsSupport>>();
    const { showContactSupportAlert } = useContactSupportAlert();
    const hasAutoOpenedRef = useRef(false);

    useEffect(() => {
        if (route.params?.autoOpenContactSupport && !hasAutoOpenedRef.current) {
            hasAutoOpenedRef.current = true;
            showContactSupportAlert({
                initialShareSystemInfo: route.params.shareSystemInfo,
            });
        }
    }, [route.params, showContactSupportAlert]);

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
