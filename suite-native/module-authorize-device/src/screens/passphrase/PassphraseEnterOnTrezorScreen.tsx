import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { cancelDiscoveryThunk, selectSelectedDevice } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, Card, CenteredTitleHeader, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/device';
import {
    isPassphraseDeviceLoadingDone,
    selectIsCreatingNewPassphraseWallet,
    setInputPassphraseOnDevice,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';
import { PassphraseMismatchAlert } from '../../components/passphrase/PassphraseMismatchAlert';
import { useRedirectOnPassphraseCompletion } from '../../useRedirectOnPassphraseCompletion';

const buttonWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const cardStyle = prepareNativeStyle(_ => ({
    paddingTop: 28,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseEnterOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const { applyStyle } = useNativeStyles();
    const device = useSelector(selectSelectedDevice);

    const isDeviceAuthorizationDone = useSelector(isPassphraseDeviceLoadingDone);

    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);

    const navigation = useNavigation<NavigationProp>();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    useRedirectOnPassphraseCompletion();

    useEffect(() => {
        if (isDeviceAuthorizationDone) {
            navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseLoading);
        }
    }, [isDeviceAuthorizationDone, navigation]);

    const handleCancel = () => {
        if (isCreatingNewWalletInstance) {
            if (device) {
                dispatch(cancelDiscoveryThunk(device));
            }
            navigateToInitialScreen();
            dispatch(setInputPassphraseOnDevice(false));
        } else {
            analytics.report({
                type: EventType.PassphraseExit,
                payload: { screen: AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor },
            });
            TrezorConnect.cancel();
            navigateToInitialScreen();
        }
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="highlight">{chunks}</Text>,
                    }}
                />
            }
        >
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing={28}>
                    <VStack justifyContent="center" alignItems="center" spacing="sp24">
                        <ConfirmOnTrezorAnimation />
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
            <PassphraseMismatchAlert />
        </PassphraseContentScreenWrapper>
    );
};
