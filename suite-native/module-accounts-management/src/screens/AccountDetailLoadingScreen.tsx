import { Dimensions } from 'react-native';

import { RouteProp, useRoute } from '@react-navigation/native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    GoBackIcon,
} from '@suite-native/navigation';
import { BoxSkeleton, Card, VStack } from '@suite-native/atoms';

const SCREEN_WIDTH = Dimensions.get('window').width;

const cardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.small,
}));

export const AccountDetailLoadingScreen = () => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader leftIcon={<GoBackIcon closeActionType={closeActionType} />} />
            }
        >
            <VStack spacing="extraLarge" alignItems="center">
                <Card style={applyStyle(cardStyle)}>
                    <BoxSkeleton width={SCREEN_WIDTH - 32} height={70} />
                </Card>
                <Card style={applyStyle(cardStyle)}>
                    <VStack spacing="large" alignItems="center" paddingHorizontal="large">
                        <BoxSkeleton width={104} height={104} borderRadius={52} />
                        <BoxSkeleton width={160} height={30} />
                        <BoxSkeleton width={200} height={24} />
                        <BoxSkeleton width={SCREEN_WIDTH - 80} height={48} borderRadius={24} />
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
