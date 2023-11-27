import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { PortfolioGraph } from './PortfolioGraph';

export const PortfolioContent = () => {
    const { translate } = useTranslate();

    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isDeviceImported = useSelector(selectIsSelectedDeviceImported);

    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
    };

    return (
        <VStack spacing="large" marginTop="small">
            <PortfolioGraph />
            <Assets />
            {isDeviceImported && (
                <Box marginHorizontal="medium">
                    <Button
                        data-testID="@home/portfolio/sync-coins-button"
                        colorScheme="tertiaryElevation0"
                        size="large"
                        onPress={handleImportAssets}
                    >
                        {translate('moduleHome.buttons.syncMyCoins')}
                    </Button>
                </Box>
            )}
            {!isUsbDeviceConnectFeatureEnabled && (
                <>
                    <Divider />
                    <Box marginHorizontal="medium">
                        <Button
                            data-testID="@home/portolio/recieve-button"
                            size="large"
                            onPress={handleReceive}
                            iconLeft="receive"
                        >
                            {translate('moduleHome.buttons.receive')}
                        </Button>
                    </Box>
                </>
            )}
        </VStack>
    );
};
