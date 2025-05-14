import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/device';
import { isPassphraseDeviceAuthorized } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { PassphraseScreenHeader } from '../../components/passphrase/PassphraseScreenHeader';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const PassphraseConfirmOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const isDeviceAuthorizationDone = useSelector(isPassphraseDeviceAuthorized);
    const device = useSelector(selectSelectedDevice);

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    // useRedirectOnPassphraseCompletion();

    // useHandlePassphraseMismatch();

    useEffect(() => {
        if (isDeviceAuthorizationDone) {
            navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseLoading);
            dispatch(
                deviceActions.removeButtonRequests({
                    device,
                    buttonRequestCode: 'ButtonRequest_Other',
                }),
            );
        }
    }, [device, dispatch, isDeviceAuthorizationDone, navigation]);

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack
                spacing="sp24"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="sp8"
            >
                <ConfirmOnTrezorAnimation />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
            </VStack>
        </Screen>
    );
};
