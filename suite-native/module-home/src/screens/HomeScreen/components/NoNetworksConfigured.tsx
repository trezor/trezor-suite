import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { AddAssetsSvg } from '../../../assets/AddAssetsSvg';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

export const NoNetworksConfigured = () => {
    const navigation = useNavigation<NavigationProps>();

    const navigateToNetworkConfiguration = () => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
        });
    };

    return (
        <Card>
            <VStack spacing="sp24">
                {/* Prevents translation clipping on CenteredTitleHeader in some languages. */}
                <Box alignItems="center">
                    <AddAssetsSvg />
                </Box>
                <CenteredTitleHeader
                    title={<Translation id="moduleHome.emptyState.initializedDevice.title" />}
                    subtitle={<Translation id="moduleHome.emptyState.initializedDevice.subtitle" />}
                />
                <Button onPress={navigateToNetworkConfiguration}>
                    <Translation id="moduleHome.emptyState.initializedDevice.button" />
                </Button>
            </VStack>
        </Card>
    );
};
