import React from 'react';
import { Pressable } from 'react-native';

import { atom, useAtom } from 'jotai';
import { useNavigation } from '@react-navigation/core';

import {
    SettingsStackRoutes,
    SettingsStackParamList,
    StackToStackCompositeNavigationProps,
    RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { Text } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

const devButtonStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    zIndex: 1,
    top: 0,
    right: 0,
    width: 50,
    height: 50,
}));

const isDevButtonVisibleAtom = atom<boolean>(false);

let tapsCount = 0;

export const ApplicationSettings = () => {
    const { applyStyle } = useNativeStyles();
    const [isVisible, setIsDevButtonVisible] = useAtom(isDevButtonVisibleAtom);

    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                SettingsStackParamList,
                SettingsStackRoutes.Settings,
                RootStackParamList
            >
        >();

    const handleNavigation = (routeName: SettingsStackRoutes): void => {
        navigation.navigate(routeName);
    };

    const handleTapsCount = () => {
        if (tapsCount < 7) {
            tapsCount++;
        }
        if (tapsCount === 7) {
            setIsDevButtonVisible(true);
        }
    };

    const shouldShowDevButton = isDevelopOrDebugEnv() || isVisible;

    return (
        <>
            <Pressable style={applyStyle(devButtonStyle)} onPress={handleTapsCount}>
                <Text> </Text>
            </Pressable>
            <SettingsSection title="Application">
                {shouldShowDevButton && (
                    <SettingsSectionItem
                        iconName="placeholder"
                        title="DEV utils"
                        subtitle="Only for devs and internal testers."
                        onPress={() => navigation.navigate(RootStackRoutes.DevUtilsStack)}
                    />
                )}
                <SettingsSectionItem
                    iconName="flag"
                    title="Localisation"
                    subtitle="Currency, Bitcoin units"
                    onPress={() => handleNavigation(SettingsStackRoutes.SettingsLocalisation)}
                />
                <SettingsSectionItem
                    title="Customization"
                    iconName="palette"
                    subtitle="Color scheme"
                    onPress={() => handleNavigation(SettingsStackRoutes.SettingsCustomization)}
                />
                <SettingsSectionItem
                    title="Privacy & Security"
                    iconName="eye"
                    subtitle="Analytics, Discreet mode"
                    onPress={() => handleNavigation(SettingsStackRoutes.SettingsPrivacyAndSecurity)}
                />
            </SettingsSection>
        </>
    );
};
