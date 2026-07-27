import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { connectPopupCallThunkInner, selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { Box, Button, Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ConnectErrorMessage = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const popupCall = useSelector(selectConnectPopupCall);
    const selectedDevice = useSelector(selectSelectedDevice);

    if (popupCall?.state !== 'call-error' && popupCall?.state !== 'error') return null;

    const getErrorMessage = () => {
        switch (popupCall.error.code) {
            case 'Deeplink_VersionMismatch':
                return <Translation id="moduleConnectPopup.errors.versionUnsupported" />;
            case 'Method_NotAllowed':
                return <Translation id="moduleConnectPopup.errors.methodNotAllowed" />;
            case 'Device_Disconnected':
            case 'Device_NotFound':
                return <Translation id="moduleConnectPopup.errors.deviceNotConnected" />;
            case 'Method_Interrupted':
            case 'Method_Cancel':
            case 'Failure_ActionCancelled':
                return <Translation id="moduleConnectPopup.errors.methodCanceled" />;
            case 'Method_InvalidParameter':
                return <Translation id="moduleConnectPopup.errors.invalidParams" />;
            default:
                return (
                    <Translation
                        id="moduleConnectPopup.errors.unknownError"
                        values={{ code: popupCall.error.code }}
                    />
                );
        }
    };
    const canRetry =
        popupCall?.state === 'call-error' &&
        ['Device_Disconnected', 'Device_NotFound'].includes(popupCall.error.code);

    const onResume = () => {
        if (popupCall?.state === 'call-error')
            dispatch(
                connectPopupCallThunkInner({
                    ...popupCall,
                    payload: {
                        ...popupCall.payload,
                        // override previously selected device
                        device: selectedDevice,
                    },
                }),
            );
    };
    const onClose = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <VStack testID="@popup/connect-error" flex={1}>
            <Card>
                <VStack spacing="sp16">
                    <Box padding="sp16">
                        <PictogramTitleHeader
                            variant="critical"
                            title={<Translation id="moduleConnectPopup.errors.requestFailed" />}
                            titleVariant="headline-sm"
                            subtitle={getErrorMessage()}
                        />
                    </Box>

                    <VStack spacing="sp12">
                        {canRetry && (
                            <Button
                                testID="@popup/retry"
                                onPress={onResume}
                                intent="critical"
                                priority="primary"
                            >
                                <Translation id="moduleConnectPopup.trezorConnect.retry" />
                            </Button>
                        )}

                        <Button
                            testID="@popup/close"
                            onPress={onClose}
                            intent="critical"
                            priority="secondary"
                        >
                            <Translation id="generic.buttons.close" />
                        </Button>
                    </VStack>
                </VStack>
            </Card>
        </VStack>
    );
};
