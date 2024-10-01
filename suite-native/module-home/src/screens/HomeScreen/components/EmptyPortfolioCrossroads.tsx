import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    AuthorizeDeviceStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { VStack, Card, Button, Text, Box } from '@suite-native/atoms';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import { analytics, EventType } from '@suite-native/analytics';

import { ConnectTrezorSvg } from '../../../assets/ConnectTrezorSvg';

const cardStyle = prepareNativeStyle<{ flex: 1 | 2 }>((utils, { flex }) => ({
    flex,
    justifyContent: 'center',
    paddingTop: utils.spacings.sp32,
    paddingBottom: utils.spacings.sp24,
    paddingHorizontal: utils.spacings.sp24,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const EmptyPortfolioCrossroads = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();

    const handleSyncMyCoins = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
        analytics.report({ type: EventType.EmptyDashboardClick, payload: { action: 'syncCoins' } });
    };

    const handleConnectDevice = () => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
        });
        analytics.report({
            type: EventType.EmptyDashboardClick,
            payload: { action: 'connectDevice' },
        });
    };

    return (
        <VStack spacing="sp16" flex={1}>
            <Card style={applyStyle(cardStyle, { flex: 2 })}>
                <VStack spacing="sp24" justifyContent="center" alignItems="center">
                    <VStack alignItems="center" spacing="sp24">
                        <ConnectTrezorSvg />
                        <VStack alignItems="center">
                            <Box>
                                <Text variant="titleSmall" textAlign="center">
                                    <Translation id="moduleHome.emptyState.connectOrImportCrossroads.gotMyTrezor.title" />
                                </Text>
                            </Box>
                            <Text color="textSubdued" textAlign="center">
                                <Translation id="moduleHome.emptyState.connectOrImportCrossroads.gotMyTrezor.description" />
                            </Text>
                        </VStack>
                    </VStack>
                    <View style={applyStyle(buttonWrapperStyle)}>
                        <Button onPress={handleConnectDevice} size="large">
                            <Translation id="moduleHome.emptyState.connectOrImportCrossroads.gotMyTrezor.connectButton" />
                        </Button>
                    </View>
                </VStack>
            </Card>
            <Card style={applyStyle(cardStyle, { flex: 1 })}>
                <VStack spacing="sp24" justifyContent="center" alignItems="center">
                    <VStack spacing="sp8" alignItems="center">
                        <Text variant="titleSmall" textAlign="center">
                            <Translation id="moduleHome.emptyState.connectOrImportCrossroads.syncCoins.title" />
                        </Text>
                        <Text color="textSubdued" textAlign="center">
                            <Translation id="moduleHome.emptyState.connectOrImportCrossroads.syncCoins.description" />
                        </Text>
                    </VStack>
                    <View style={applyStyle(buttonWrapperStyle)}>
                        <Button
                            onPress={handleSyncMyCoins}
                            colorScheme="tertiaryElevation1"
                            size="large"
                            testID="@home/portfolio/sync-coins-button"
                        >
                            <Translation id="moduleHome.emptyState.connectOrImportCrossroads.syncCoins.syncButton" />
                        </Button>
                    </View>
                </VStack>
            </Card>
        </VStack>
    );
};
