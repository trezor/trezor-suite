import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/core';

import { CardDivider, HStack, RoundedIcon, Text } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import { WalletConnectPairBottomSheet } from '@suite-native/module-connect-popup';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { SettingsSection } from './SettingsSection';
import { SettingsSectionItem } from './SettingsSectionItem';

export const ConnectionSettings = () => {
    const isConnectPopupEnabled = useFeatureFlag(FeatureFlag.IsConnectPopupEnabled);
    const isWalletConnectEnabled = useFeatureFlag(FeatureFlag.IsWalletConnectEnabled);

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const [pairingOpened, setPairingOpened] = useState<'qr' | 'manual' | null>(null);

    if (!isConnectPopupEnabled && !isWalletConnectEnabled) {
        return null;
    }

    return (
        <SettingsSection
            title={<Translation id="moduleSettings.items.connections.title" />}
            spacing="sp16"
        >
            {isWalletConnectEnabled && (
                <>
                    <WalletConnectPairBottomSheet
                        pairingOpened={pairingOpened}
                        setPairingOpened={setPairingOpened}
                    />
                    <TouchableOpacity
                        onPress={() => setPairingOpened('qr')}
                        testID="@settings/wallet-connect-add"
                    >
                        <HStack spacing="sp16" alignItems="center">
                            <RoundedIcon
                                name="qrCode"
                                color="iconPrimaryDefault"
                                backgroundColor="backgroundPrimarySubtleOnElevation0"
                                iconSize="mediumLarge"
                            />
                            <Text color="textPrimaryDefault">
                                <Translation id="moduleSettings.items.connections.walletConnect.add" />
                            </Text>
                        </HStack>
                    </TouchableOpacity>
                    <CardDivider />
                </>
            )}
            {isWalletConnectEnabled && (
                <SettingsSectionItem
                    iconName="walletConnect"
                    title={
                        <Translation id="moduleSettings.items.connections.walletConnect.title" />
                    }
                    subtitle={
                        <Translation id="moduleSettings.items.connections.walletConnect.subtitle" />
                    }
                    onPress={() => navigation.navigate(RootStackRoutes.WalletConnectPair)}
                    testID="@settings/wallet-connect"
                />
            )}
        </SettingsSection>
    );
};
