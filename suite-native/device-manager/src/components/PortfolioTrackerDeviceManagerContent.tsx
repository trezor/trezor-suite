import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsPortfolioEmpty } from '@suite-common/wallet-core';
import { useOpenLink } from '@suite-native/link';

import { DeviceManagerModal } from './DeviceManagerModal';
import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const PortfolioTrackerDeviceManagerContent = () => {
    const { translate } = useTranslate();
    const openLink = useOpenLink();

    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);

    const navigation = useNavigation<NavigationProp>();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleSyncCoins = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn');
    };

    const handleOpenEshopLink = () => {
        openLink('https://trezor.io/');
    };

    const syncButtonTitle = translate(
        isPortfolioEmpty
            ? 'deviceManager.syncCoinsButton.syncMyCoins'
            : 'deviceManager.syncCoinsButton.syncAnother',
    );

    return (
        <DeviceManagerModal>
            <Button colorScheme="tertiaryElevation1" onPress={handleSyncCoins}>
                {syncButtonTitle}
            </Button>
            <VStack>
                <Text variant="callout">
                    <Translation id="deviceManager.portfolioTracker.explore" />
                </Text>
                <Button
                    colorScheme="tertiaryElevation1"
                    iconRight="link"
                    onPress={handleOpenEduLink}
                >
                    {translate('deviceManager.portfolioTracker.learnBasics')}
                </Button>
                <Button
                    colorScheme="tertiaryElevation1"
                    iconRight="link"
                    onPress={handleOpenEshopLink}
                >
                    {translate('deviceManager.portfolioTracker.exploreShop')}
                </Button>
            </VStack>
        </DeviceManagerModal>
    );
};
