import { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import {
    selectHasRunningDiscovery,
    selectIsDeviceConnectedAndAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import {
    Box,
    Button,
    Card,
    CheckBox,
    ErrorMessage,
    HStack,
    Loader,
    Text,
    TextDivider,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { DeviceManager } from '@suite-native/device-manager';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { ButtonRequestsOverlay } from '../components/ButtonRequestsOverlay';
import { ConnectAppIcon } from '../components/ConnectAppIcon';

export const ConnectPopupScreen = () => {
    const navigation = useNavigation();

    const dispatch = useDispatch();
    const deviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const validDevice = deviceConnectedAndAuthorized && !isPortfolioTrackerDevice;
    const discoveryActive = useSelector(selectHasRunningDiscovery);
    const popupCall = useSelector(selectConnectPopupCall);
    const [isRemembered, setIsRemembered] = useState(false);

    useEffect(() => {
        if (popupCall?.state == 'finished' && navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [popupCall, navigation]);

    const mainView = useMemo(() => {
        if (!popupCall) {
            return (
                <Loader
                    size="large"
                    title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
                />
            );
        }

        if (discoveryActive) {
            return (
                <Loader
                    size="large"
                    title={
                        <Translation id="moduleConnectPopup.connectionStatus.discoveryRunning" />
                    }
                />
            );
        }

        if (validDevice) {
            if (popupCall.state === 'permission-request') {
                if (!popupCall.source.origin) {
                    return (
                        <ErrorMessage
                            errorMessage={
                                <Translation id="moduleConnectPopup.errors.invalidCallback" />
                            }
                        />
                    );
                }

                const onConfirm = () => {
                    if (isRemembered) {
                        dispatch(
                            connectPopupActions.rememberAppPermissions({
                                types: popupCall.methodInfo.permissionTypes,
                                ...popupCall.source,
                            }),
                        );
                    }
                    dispatch(connectPopupActions.approvePermissions());
                };

                return (
                    <VStack testID="@popup/deeplink-info" spacing="sp16" flex={1}>
                        <TitleHeader
                            title={<Translation id="moduleConnectPopup.grantPermission.title" />}
                            subtitle={
                                <Translation id="moduleConnectPopup.grantPermission.message" />
                            }
                        />

                        <Card>
                            <HStack alignItems="center" spacing="sp16">
                                <ConnectAppIcon
                                    src={popupCall.source.manifest?.appIcon}
                                    type="trezorConnect"
                                    size="large"
                                />
                                <VStack flex={1} spacing="sp4">
                                    <Text>
                                        {popupCall.source.manifest?.appName ??
                                            popupCall.source.origin}
                                    </Text>
                                    {popupCall.source.manifest?.appName && (
                                        <Text color="textSubdued">{popupCall.source.origin}</Text>
                                    )}
                                </VStack>
                            </HStack>

                            <TextDivider title="moduleConnectPopup.permissions.title" />

                            <VStack spacing="sp8" padding="sp8">
                                {popupCall.methodInfo.permissionTypes.map(permission => (
                                    <HStack key={permission} alignItems="center" spacing="sp8">
                                        <Icon name="checkCircle" color="iconPrimaryDefault" />
                                        <Text color="textSubdued" variant="hint">
                                            <Translation
                                                id={`moduleConnectPopup.permissions.${permission}`}
                                            />
                                        </Text>
                                    </HStack>
                                ))}
                            </VStack>

                            <TextDivider title="moduleConnectPopup.optional" />

                            <TouchableOpacity onPress={() => setIsRemembered(!isRemembered)}>
                                <HStack spacing="sp16" padding="sp8" alignItems="center">
                                    <CheckBox
                                        isChecked={isRemembered}
                                        onChange={() => setIsRemembered(!isRemembered)}
                                    />
                                    <Text color="textSubdued" variant="hint">
                                        <Translation id="moduleConnectPopup.alwaysAllow" />
                                    </Text>
                                </HStack>
                            </TouchableOpacity>
                        </Card>

                        <Button testID="@popup/call-device" onPress={onConfirm}>
                            {popupCall.methodInfo.confirmLabel || (
                                <Translation id="moduleConnectPopup.confirm" />
                            )}
                        </Button>
                        <Button
                            colorScheme="tertiaryElevation0"
                            onPress={() => navigation.goBack()}
                        >
                            <Translation id="generic.buttons.close" />
                        </Button>
                    </VStack>
                );
            }

            if (popupCall.state === 'call-error') {
                const getTranslationId = () => {
                    switch (popupCall.error.code) {
                        case 'Deeplink_VersionMismatch':
                            return 'moduleConnectPopup.errors.versionUnsupported';
                        case 'Method_NotAllowed':
                            return 'moduleConnectPopup.errors.methodNotAllowed';
                        case 'Device_NotFound':
                            return 'moduleConnectPopup.errors.deviceNotConnected';
                        default:
                            return 'moduleConnectPopup.errors.invalidParams';
                    }
                };

                return <ErrorMessage errorMessage={<Translation id={getTranslationId()} />} />;
            }

            return (
                <Loader
                    size="large"
                    title={<Translation id="moduleConnectPopup.connectionStatus.loading" />}
                />
            );
        } else {
            return (
                <Loader
                    size="large"
                    title={<Translation id="moduleConnectPopup.errors.deviceNotConnected" />}
                />
            );
        }
    }, [validDevice, popupCall, discoveryActive, isRemembered, dispatch, navigation]);

    return (
        <Screen>
            <Box>
                <DeviceManager />
            </Box>

            <Box
                padding="sp8"
                paddingTop="sp16"
                flex={1}
                justifyContent="center"
                alignItems="center"
            >
                {mainView}
            </Box>

            <ButtonRequestsOverlay />
        </Screen>
    );
};
