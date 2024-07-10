import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    deviceActions,
    selectDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';

import { DeviceT3T1Svg } from '../../assets/passphrase/DeviceT3T1Svg';
import { PassphraseScreenWrapper } from '../../components/passphrase/PassphraseScreenWrapper';
import { useAuthorizationSuccess } from '../../usePassphraseAuthorizationSuccess';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const PassphraseConfirmOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const device = useSelector(selectDevice);

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    useAuthorizationSuccess();

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized && isDiscoveryActive) {
            navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseLoading);
            dispatch(
                deviceActions.removeButtonRequests({
                    device,
                    buttonRequestCode: 'ButtonRequest_Other',
                }),
            );
        }
    }, [device, dispatch, isDeviceConnectedAndAuthorized, isDiscoveryActive, navigation]);

    return (
        <PassphraseScreenWrapper>
            <VStack
                spacing="large"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="small"
            >
                <DeviceT3T1Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
            </VStack>
        </PassphraseScreenWrapper>
    );
};
