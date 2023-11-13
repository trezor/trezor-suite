import { useNavigation } from '@react-navigation/native';

import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { DeviceManagerModal } from './DeviceManagerModal';
import { useDeviceManager } from '../hooks/useDeviceManager';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

export const PortfolioTrackerDeviceManagerContent = () => {
    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

    const { setIsDeviceManagerVisible } = useDeviceManager();

    const handleSyncCoins = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <DeviceManagerModal>
            <Button colorScheme="tertiaryElevation0" onPress={handleSyncCoins}>
                {translate('deviceManager.syncCoinsButton')}
            </Button>
            <VStack>
                <Text variant="callout">
                    <Translation id="deviceManager.portfolioTracker.explore" />
                </Text>
                <Button colorScheme="tertiaryElevation0">
                    {translate('deviceManager.portfolioTracker.learnBasics')}
                </Button>
                <Button colorScheme="tertiaryElevation0">
                    {translate('deviceManager.portfolioTracker.readDocs')}
                </Button>
            </VStack>
        </DeviceManagerModal>
    );
};
