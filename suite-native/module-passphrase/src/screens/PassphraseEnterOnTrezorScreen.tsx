import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Box, Button, Card, CenteredTitleHeader, Text, VStack } from '@suite-native/atoms';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { cancelPassphraseAndSelectStandardDeviceThunk } from '../passphraseThunks';
import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { DeviceT2B1Svg } from '../assets/DeviceT2B1Svg';

const buttonWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const cardStyle = prepareNativeStyle(_ => ({
    paddingTop: 28,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseEnterOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const { applyStyle } = useNativeStyles();

    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        if (isDiscoveryActive) {
            navigation.navigate(PassphraseStackRoutes.PassphraseLoading);
        }
    }, [isDiscoveryActive, navigation]);

    const handleCancel = () => {
        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack spacing="large">
                <VStack>
                    <Text variant="titleMedium">
                        <Translation id="modulePassphrase.title" />
                    </Text>
                    <Text>
                        <Translation
                            id="modulePassphrase.subtitle"
                            values={{
                                bold: chunks => <Text variant="highlight">{chunks}</Text>,
                            }}
                        />
                    </Text>
                </VStack>
                <Card style={applyStyle(cardStyle)}>
                    <VStack spacing={28}>
                        <VStack justifyContent="center" alignItems="center">
                            <DeviceT2B1Svg />
                            <CenteredTitleHeader
                                title={
                                    <Translation id="modulePassphrase.enterPassphraseOnTrezor.title" />
                                }
                                subtitle={
                                    <Translation id="modulePassphrase.enterPassphraseOnTrezor.subtitle" />
                                }
                            />
                        </VStack>
                        <Box style={applyStyle(buttonWrapperStyle)}>
                            <Button onPress={handleCancel} colorScheme="redElevation1">
                                <Translation id="generic.buttons.cancel" />
                            </Button>
                        </Box>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
