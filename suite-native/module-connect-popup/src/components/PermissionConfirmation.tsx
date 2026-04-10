import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import {
    Button,
    Card,
    CheckBox,
    ErrorMessage,
    HStack,
    PressableOpacity,
    Text,
    TextDivider,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type MethodPermission } from '@trezor/connect/src/core/AbstractMethod';

import { ConnectAppIcon } from '../components/ConnectAppIcon';

const permissionTranslationKeysMap = {
    read: 'moduleConnectPopup.permissions.read',
    write: 'moduleConnectPopup.permissions.write',
    management: 'moduleConnectPopup.permissions.management',
    push_tx: 'moduleConnectPopup.permissions.push_tx',
} as const satisfies Record<MethodPermission, TxKeyPath>;

export const PermissionConfirmation = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const popupCall = useSelector(selectConnectPopupCall);

    const [isRemembered, setIsRemembered] = useState(false);

    if (popupCall?.state !== 'permission-request') return null;

    if (!popupCall.source.origin) {
        return (
            <ErrorMessage
                errorMessage={<Translation id="moduleConnectPopup.errors.invalidCallback" />}
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
    const onClose = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <VStack testID="@popup/deeplink-info" spacing="sp16" flex={1}>
            <TitleHeader
                title={<Translation id="moduleConnectPopup.grantPermission.title" />}
                subtitle={<Translation id="moduleConnectPopup.grantPermission.message" />}
            />

            <Card>
                <HStack alignItems="center" spacing="sp16">
                    <ConnectAppIcon
                        src={popupCall.source.manifest?.appIcon}
                        type="trezorConnect"
                        size="large"
                    />
                    <VStack flex={1} spacing="sp4">
                        <Text>{popupCall.source.manifest?.appName ?? popupCall.source.origin}</Text>
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
                            <Text color="textSubdued" variant="body-sm" style={{ flex: 1 }}>
                                <Translation id={permissionTranslationKeysMap[permission]} />
                            </Text>
                        </HStack>
                    ))}
                </VStack>

                <TextDivider title="moduleConnectPopup.optional" />

                <PressableOpacity onPress={() => setIsRemembered(!isRemembered)}>
                    <HStack spacing="sp16" padding="sp8" alignItems="center">
                        <CheckBox
                            isChecked={isRemembered}
                            onChange={() => setIsRemembered(!isRemembered)}
                        />
                        <Text color="textSubdued" variant="body-sm">
                            <Translation id="moduleConnectPopup.alwaysAllow" />
                        </Text>
                    </HStack>
                </PressableOpacity>
            </Card>

            <VStack spacing="sp12">
                <Button testID="@popup/call-device" onPress={onConfirm}>
                    {popupCall.methodInfo.confirmLabel || (
                        <Translation id="moduleConnectPopup.confirm" />
                    )}
                </Button>
                <Button intent="neutral" priority="secondary" onPress={onClose}>
                    <Translation id="generic.buttons.close" />
                </Button>
            </VStack>
        </VStack>
    );
};
