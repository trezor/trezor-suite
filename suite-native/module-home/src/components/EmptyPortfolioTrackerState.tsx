import { Dimensions } from 'react-native';
import { useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text, Card, Image, VStack, Button } from '@suite-native/atoms';
import { useActiveColorScheme } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    HomeStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeNavigationProp,
} from '@suite-native/navigation';

import { SettingsButtonLink } from './SettingsButtonLink';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

const imageStyle = prepareNativeStyle(_ => ({
    maxHeight: SCREEN_HEIGHT * 0.25,
    width: '100%',
    alignItems: 'center',
}));

type NavigationProp = StackToTabCompositeNavigationProp<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

export const EmptyPortfolioTrackerState = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();

    const { translate } = useTranslate();

    const colorScheme = useActiveColorScheme();

    const image = useMemo(() => {
        if (colorScheme === 'dark') {
            return require('../assets/darkDashboard.png');
        }
        return require('../assets/dashboard.png');
    }, [colorScheme]);

    const handleSyncMyCoins = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    return (
        <VStack spacing="extraLarge">
            <Card
                alertVariant="info"
                alertTitle={translate('moduleHome.emptyState.portfolioTracker.alert')}
            >
                <VStack
                    spacing="large"
                    paddingTop="medium"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Image source={image} resizeMode="contain" style={applyStyle(imageStyle)} />
                    <Text variant="titleSmall" testID="@emptyHome/welcomeHeader">
                        <Translation id="moduleHome.emptyState.portfolioTracker.title" />
                    </Text>
                    <Text color="textSubdued" textAlign="center">
                        <Translation id="moduleHome.emptyState.portfolioTracker.subtitle" />
                    </Text>
                    <Button onPress={handleSyncMyCoins} testID="@emptyHome/sync-my-coin">
                        {translate('moduleHome.emptyState.portfolioTracker.primaryButton')}
                    </Button>
                </VStack>
            </Card>
            <SettingsButtonLink />
        </VStack>
    );
};
