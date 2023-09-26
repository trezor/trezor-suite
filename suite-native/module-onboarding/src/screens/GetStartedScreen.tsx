import { Dimensions } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    ConnectDeviceStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { AlertBox, Box, Image, VStack } from '@suite-native/atoms';
import { useActiveColorScheme } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

type NavigationProps = StackToStackCompositeNavigationProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.GetStarted,
    RootStackParamList
>;
const SCREEN_HEIGHT = Dimensions.get('screen').height;

const imageStyle = prepareNativeStyle(_ => ({ maxHeight: SCREEN_HEIGHT * 0.25 }));

const footerStyle = prepareNativeStyle(_ => ({ width: '100%', alignItems: 'center' }));

export const GetStartedScreen = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const colorScheme = useActiveColorScheme();
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    const handleRedirect = () => {
        if (isUsbDeviceConnectFeatureEnabled) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
            });
            return;
        }

        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const getImageSource = () => {
        if (colorScheme === 'dark') {
            return require('../assets/darkDashboard.png');
        }
        return require('../assets/dashboard.png');
    };

    return (
        <OnboardingScreen
            title="Get started"
            subtitle="Click below, sync your coin addresses, and view your portfolio balance."
            activeStep={4}
        >
            <Box />
            <Box alignItems="center" marginBottom="medium">
                <Image
                    source={getImageSource()}
                    resizeMode="contain"
                    style={applyStyle(imageStyle)}
                />
            </Box>
            <VStack style={applyStyle(footerStyle)} spacing="medium">
                <AlertBox title="This requires your Trezor hardware wallet and access to Trezor Suite." />

                <OnboardingFooter redirectTarget={handleRedirect} isLastStep />
            </VStack>
        </OnboardingScreen>
    );
};
