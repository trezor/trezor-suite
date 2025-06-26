import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/core';

import { Box, Card, CardDivider, HStack, RoundedIcon, Text } from '@suite-native/atoms';
// import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { WalletConnectPairBottomSheet } from '@suite-native/module-connect-popup';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';
import { SettingsSection } from './SettingsSection';

export const ConnectionSettings = () => {
    // const isConnectPopupEnabled = useFeatureFlag(FeatureFlag.IsConnectPopupEnabled);
    // const isWalletConnectEnabled = useFeatureFlag(FeatureFlag.IsWalletConnectEnabled);
    const isConnectPopupEnabled = true;
    const isWalletConnectEnabled = true;

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const [pairingOpened, setPairingOpened] = useState<'qr' | 'manual' | null>(null);

    if (!isConnectPopupEnabled && !isWalletConnectEnabled) {
        return null;
    }

    return (
        <SettingsSection title={<Translation id="moduleSettings.items.connections.title" />}>
            <Card noPadding>
                {isWalletConnectEnabled && (
                    <AppSettingsCardWithIconLayout
                        icon="walletConnect"
                        title={
                            <Translation id="moduleSettings.items.connections.walletConnect.title" />
                        }
                        onPress={() => navigation.navigate(RootStackRoutes.WalletConnectPair)}
                        testID="@settings/wallet-connect"
                        borderColor={null}
                        noShadow
                    />
                )}
                <CardDivider />
                {isWalletConnectEnabled && (
                    <Box paddingHorizontal="sp16" paddingVertical="sp12">
                        <WalletConnectPairBottomSheet
                            pairingOpened={pairingOpened}
                            setPairingOpened={setPairingOpened}
                        />
                        <TouchableOpacity
                            onPress={() => setPairingOpened('qr')}
                            testID="@settings/wallet-connect-add"
                        >
                            <HStack justifyContent="space-between" alignItems="center">
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
                                <Icon name="plus" color="textSecondaryHighlight" />
                            </HStack>
                        </TouchableOpacity>
                    </Box>
                )}
            </Card>
            {isConnectPopupEnabled && (
                <AppSettingsCardWithIconLayout
                    icon="trezorLogo"
                    title={
                        <Translation id="moduleSettings.items.connections.trezorConnect.title" />
                    }
                    onPress={() => navigation.navigate(RootStackRoutes.ConnectPermissions)}
                    testID="@settings/connect-permissions"
                />
            )}
        </SettingsSection>
    );
};
