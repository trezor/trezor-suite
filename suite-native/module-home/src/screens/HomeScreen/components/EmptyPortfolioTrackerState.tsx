import { Dimensions, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Text, Card, Image, VStack, Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeNavigationProp,
} from '@suite-native/navigation';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.extraLarge,
    paddingBottom: utils.spacings.large,
    paddingVertical: utils.spacings.large,
}));
const imageStyle = prepareNativeStyle(_ => ({
    maxHeight: SCREEN_HEIGHT * 0.25,
    width: '100%',
    height: 180,
    alignItems: 'center',
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type NavigationProp = StackToTabCompositeNavigationProp<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const EmptyPortfolioTrackerState = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();

    const handleSyncMyCoins = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <VStack spacing="extraLarge">
            <Card
                alertVariant="info"
                alertTitle={<Translation id="moduleHome.emptyState.portfolioTracker.alert" />}
                style={applyStyle(cardStyle)}
            >
                <VStack
                    spacing="extraLarge"
                    alignItems="center"
                    justifyContent="center"
                    paddingHorizontal="extraSmall"
                >
                    <VStack
                        spacing="medium"
                        paddingTop="small"
                        paddingBottom="small"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text variant="titleMedium">
                            <Translation id="moduleHome.emptyState.portfolioTracker.title" />
                        </Text>
                        <Text color="textSubdued" textAlign="center">
                            <Translation id="moduleHome.emptyState.portfolioTracker.subtitle" />
                        </Text>
                    </VStack>
                    <Image
                        source={require('../../../assets/dashboard.png')}
                        contentFit="contain"
                        style={applyStyle(imageStyle)}
                    />
                    <View style={applyStyle(buttonWrapperStyle)}>
                        <Button
                            onPress={handleSyncMyCoins}
                            testID="@home/portfolio/sync-coins-button"
                        >
                            <Translation id="moduleHome.emptyState.portfolioTracker.primaryButton" />
                        </Button>
                    </View>
                </VStack>
            </Card>
        </VStack>
    );
};
