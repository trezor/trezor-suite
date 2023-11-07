import { Dimensions } from 'react-native';
import { useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text, AlertBox, Card, Image, VStack, Button } from '@suite-native/atoms';
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

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: 0,
    paddingBottom: utils.spacings.extraLarge,
    paddingHorizontal: 0,
}));

const contentStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.m,
    paddingTop: utils.spacings.extraLarge,
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
            <Card style={applyStyle(cardStyle)}>
                <AlertBox
                    variant="info"
                    title={translate('moduleHome.emptyState.portfolioTracker.alert')}
                />
                <VStack spacing="large" style={applyStyle(contentStyle)}>
                    <Image source={image} resizeMode="contain" style={applyStyle(imageStyle)} />
                    <Text variant="titleSmall">
                        <Translation id="moduleHome.emptyState.portfolioTracker.title" />
                    </Text>
                    <Text color="textSubdued" textAlign="center">
                        <Translation id="moduleHome.emptyState.portfolioTracker.subtitle" />
                    </Text>
                    <Button onPress={handleSyncMyCoins}>
                        {translate('moduleHome.emptyState.portfolioTracker.primaryButton')}
                    </Button>
                </VStack>
            </Card>
            <SettingsButtonLink />
        </VStack>
    );
};
