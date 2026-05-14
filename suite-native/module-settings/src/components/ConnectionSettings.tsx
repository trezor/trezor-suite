import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    Box,
    Card,
    CardDivider,
    HStack,
    PressableOpacity,
    RoundedIcon,
    Text,
    TitledSection,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { WalletConnectPairBottomSheet } from '@suite-native/module-connect-popup';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';

export const ConnectionSettings = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);

    // show only for real devices that are ready to be used
    if (isPortfolioTrackerDevice || !isDeviceReadyToUseAndAuthorized) {
        return null;
    }

    return (
        <TitledSection title={<Translation id="moduleSettings.items.connections.title" />}>
            <Card noPadding>
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

                <CardDivider />
                <Box paddingHorizontal="sp16" paddingVertical="sp12">
                    <WalletConnectPairBottomSheet ref={bottomSheetRef} onClose={closeModal} />
                    <PressableOpacity onPress={openModal} testID="@settings/wallet-connect-add">
                        <HStack justifyContent="space-between" alignItems="center">
                            <HStack spacing="sp16" alignItems="center">
                                <RoundedIcon name="qrCode" intent="brand" />
                                <Text color="contentBrand">
                                    <Translation id="moduleSettings.items.connections.walletConnect.add" />
                                </Text>
                            </HStack>
                            <Icon name="plus" color="contentBrand" />
                        </HStack>
                    </PressableOpacity>
                </Box>
            </Card>

            <AppSettingsCardWithIconLayout
                icon="trezorLogo"
                title={<Translation id="moduleSettings.items.connections.trezorConnect.title" />}
                onPress={() => navigation.navigate(RootStackRoutes.ConnectPermissions)}
                testID="@settings/connect-permissions"
            />
        </TitledSection>
    );
};
