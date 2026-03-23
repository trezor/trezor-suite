import { useNavigation } from '@react-navigation/native';

import { Button, Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AddCoinAccountStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: utils.spacings.sp32,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const contentStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const EmptyConnectedDeviceState = () => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    const handleAddAccount = () => {
        navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinAccount,
            params: {
                flowType: 'home',
            },
        });
    };

    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack spacing="sp24" style={applyStyle(contentStyle)}>
                <PictogramTitleHeader
                    variant="info"
                    title={<Translation id="moduleHome.emptyState.emptyDevice.title" />}
                    subtitle={<Translation id="moduleHome.emptyState.emptyDevice.subtitle" />}
                />
                <Button size="large" onPress={handleAddAccount}>
                    <Translation id="moduleHome.emptyState.emptyDevice.button" />
                </Button>
            </VStack>
        </Card>
    );
};
