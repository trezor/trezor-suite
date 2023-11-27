import { useNavigation } from '@react-navigation/native';

import { Box, Button, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { PortfolioGraph } from './PortfolioGraph';
import { DashboardNavigationButtons } from './DashboardNavigationButtons';

export const PortfolioContent = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <VStack spacing="large" marginTop="small">
            <PortfolioGraph />
            <Assets />
            <Box marginHorizontal="medium">
                <Button
                    data-testID="@home/portfolio/sync-coins-button"
                    colorScheme="tertiaryElevation0"
                    size="large"
                    onPress={handleImportAssets}
                >
                    Sync my coins
                </Button>
            </Box>
            {!isUsbDeviceConnectFeatureEnabled && <DashboardNavigationButtons />}
        </VStack>
    );
};
