import { useNavigation } from '@react-navigation/native';

import { Button, Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import {
    AddCoinAccountStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: utils.spacings.sp32,
    paddingHorizontal: utils.spacings.sp24,
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
                    variant="green"
                    size="large"
                    icon="infoLight"
                    title={<Translation id="moduleHome.emptyState.device.title" />}
                    subtitle={<Translation id="moduleHome.emptyState.device.subtitle" />}
                />
                <Button size="large" onPress={handleAddAccount}>
                    <Translation id="moduleHome.emptyState.device.button" />
                </Button>
            </VStack>
        </Card>
    );
};
