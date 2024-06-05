import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';
import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsEmptyDevice } from '@suite-common/wallet-core';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceManagerModal } from './DeviceManagerModal';
import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

const contentStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,

    spacing: utils.spacings.medium,

    paddingBottom: utils.spacings.medium,
    marginTop: utils.spacings.medium,
}));

export const PortfolioTrackerDeviceManagerContent = () => {
    const openLink = useOpenLink();
    const { applyStyle } = useNativeStyles();

    const isEmptyDevice = useSelector(selectIsEmptyDevice);

    const navigation = useNavigation<NavigationProp>();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleSyncCoins = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'syncCoinsButton' },
        });
    };

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn');
        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'educationLink' },
        });
    };

    const handleOpenEshopLink = () => {
        openLink('https://trezor.io/');
        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'eshopLink' },
        });
    };

    const syncButtonTitle = (
        <Translation
            id={
                isEmptyDevice
                    ? 'deviceManager.syncCoinsButton.syncMyCoins'
                    : 'deviceManager.syncCoinsButton.syncAnother'
            }
        />
    );

    return (
        <DeviceManagerModal>
            <VStack style={applyStyle(contentStyle)}>
                <Button colorScheme="tertiaryElevation0" onPress={handleSyncCoins}>
                    {syncButtonTitle}
                </Button>
                <VStack>
                    <Text variant="callout">
                        <Translation id="deviceManager.portfolioTracker.explore" />
                    </Text>
                    <Button
                        colorScheme="tertiaryElevation0"
                        viewRight="link"
                        onPress={handleOpenEduLink}
                    >
                        <Translation id="deviceManager.portfolioTracker.learnBasics" />
                    </Button>
                    <Button
                        colorScheme="tertiaryElevation0"
                        viewRight="link"
                        onPress={handleOpenEshopLink}
                    >
                        <Translation id="deviceManager.portfolioTracker.exploreShop" />
                    </Button>
                </VStack>
            </VStack>
        </DeviceManagerModal>
    );
};
