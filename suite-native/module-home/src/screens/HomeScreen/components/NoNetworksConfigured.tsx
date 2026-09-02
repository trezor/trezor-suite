import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { selectIsOnboardingFeedbackBannerEnabled } from '@suite-native/banners';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { OnboardingFeedbackBanner } from './OnboardingFeedbackBanner';
import { AddAssetsSvg } from '../../../assets/AddAssetsSvg';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

export const NoNetworksConfigured = () => {
    const navigation = useNavigation<NavigationProps>();
    const isOnboardingFeedbackBannerEnabled = useSelector(selectIsOnboardingFeedbackBannerEnabled);

    const navigateToNetworkConfiguration = () => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
        });
    };

    return (
        <VStack flex={1} spacing="sp16" paddingBottom="sp32">
            <Card>
                <VStack spacing="sp24">
                    {/* Prevents translation clipping on CenteredTitleHeader in some languages. */}
                    <Box alignItems="center">
                        <AddAssetsSvg />
                    </Box>
                    <CenteredTitleHeader
                        title={<Translation id="moduleHome.emptyState.initializedDevice.title" />}
                        subtitle={
                            <Translation id="moduleHome.emptyState.initializedDevice.subtitle" />
                        }
                        alignSelf="stretch"
                    />
                    <Button
                        onPress={navigateToNetworkConfiguration}
                        testID="@home/get-started-button"
                    >
                        <Translation id="moduleHome.emptyState.initializedDevice.button" />
                    </Button>
                </VStack>
            </Card>
            {isOnboardingFeedbackBannerEnabled && <OnboardingFeedbackBanner />}
        </VStack>
    );
};
