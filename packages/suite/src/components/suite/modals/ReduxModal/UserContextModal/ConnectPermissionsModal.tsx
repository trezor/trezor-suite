import { useState } from 'react';

import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { CALL_SOURCE_WALLETCONNECT } from '@suite-common/connect-popup/src/connectPopupTypes';
import { Card, Checkbox, Column, Icon, List, Modal, Row, Text, Tooltip } from '@trezor/components';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { spacings } from '@trezor/theme';

import { ConnectAppIcon } from 'src/components/suite/ConnectAppIcon';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { ConnectProcessLabel } from 'src/components/suite/ConnectProcessLabel';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { getPermissionText } from 'src/views/settings/SettingsConnectedApps/ConnectPermissions';

export const ConnectPermissionsModal = () => {
    const analytics = useAnalytics();
    const [isRemembered, setIsRemembered] = useState(false);
    const [isSilentMode, setIsSilentMode] = useState(false);
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    if (!popupCall || popupCall?.state !== 'permission-request') return null;

    const { method, methodInfo, source } = popupCall;
    const { confirmLabel, permissionTypes } = methodInfo;

    const rememberPayload = {
        types: permissionTypes,
        ...source,
        silentMode: isSilentMode,
    };
    const onConfirm = () => {
        if (isRemembered) {
            dispatch(connectPopupActions.rememberAppPermissions(rememberPayload));
        }
        dispatch(connectPopupActions.approvePermissions());
        analytics.report({
            type: events.connectPopupPermissionsEvent.name,
            payload: {
                method,
                origin: source.origin,
                approved: true,
            },
        });
    };
    const onCancel = () => {
        dispatch(connectPopupActions.rejectPermissions(ERRORS.TypedError('Method_Cancel')));

        analytics.report({
            type: events.connectPopupPermissionsEvent.name,
            payload: {
                method,
                origin: source.origin,
                approved: false,
            },
        });
    };

    return (
        <ConnectModalBackdrop onClick={onCancel} canSwitchDevice>
            <Modal.ModalBase
                onCancel={onCancel}
                bottomContent={
                    <>
                        <Modal.Button
                            onClick={onConfirm}
                            data-testid="@connect-permissions-modal/confirm-button"
                        >
                            {confirmLabel || <Translation id="TR_CONFIRM" />}
                        </Modal.Button>
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={onCancel}
                            data-testid="@connect-permissions-modal/cancel-button"
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                heading={<Translation id="TR_GRANT_PERMISSIONS" />}
                description={<Translation id="TR_GRANT_PERMISSIONS_DESCRIPTION" />}
            >
                <Column gap={spacings.xs}>
                    <Text>
                        <Translation id="TR_APP" />
                    </Text>

                    <Card>
                        <Row gap={spacings.md}>
                            <ConnectAppIcon
                                src={source.manifest?.appIcon}
                                size={spacings.xxxxl}
                                type={
                                    source.type === CALL_SOURCE_WALLETCONNECT
                                        ? 'walletConnect'
                                        : 'trezorConnect'
                                }
                            />

                            <Column gap={spacings.xxs}>
                                <Row gap={spacings.sm}>
                                    {source.manifest?.appName ? (
                                        <>
                                            <Text data-testid="@connect-permissions-modal/app-name">
                                                {source.manifest.appName}
                                            </Text>
                                            <Text intent="neutral" priority="secondary">
                                                {source.origin}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text>{source.origin}</Text>
                                    )}
                                </Row>
                                <Row>
                                    {source.process && (
                                        <ConnectProcessLabel
                                            process={source.process}
                                            data-testid="@connect-permissions-modal/paragraph-process"
                                        />
                                    )}
                                </Row>
                            </Column>
                        </Row>
                    </Card>

                    <Text>
                        <Translation id="TR_PERMISSIONS" />
                    </Text>

                    <Card>
                        <List>
                            {permissionTypes.map(permission => (
                                <List.Item
                                    key={permission}
                                    bulletComponent={<Icon name="checkCircle" intent="brand" />}
                                >
                                    {getPermissionText(permission)}
                                </List.Item>
                            ))}
                        </List>
                    </Card>
                    {source.type !== CALL_SOURCE_WALLETCONNECT && (
                        <>
                            <Text>
                                <Translation id="TR_OPTIONAL" />
                            </Text>

                            <Card>
                                <Column gap={spacings.sm}>
                                    <Checkbox
                                        data-testid="@connect-permissions-modal/remember-checkbox"
                                        isChecked={isRemembered}
                                        onChange={() => setIsRemembered(!isRemembered)}
                                    >
                                        <Translation id="TR_CONNECT_MODAL_REMEMBER" />
                                    </Checkbox>
                                    {isRemembered && (
                                        <Tooltip
                                            content={
                                                <Translation id="TR_CONNECT_APP_SILENT_MODE_DESCRIPTION" />
                                            }
                                            placement="bottom"
                                        >
                                            <Checkbox
                                                data-testid="@connect-permissions-modal/silent-mode-checkbox"
                                                isChecked={isSilentMode}
                                                onChange={() => setIsSilentMode(!isSilentMode)}
                                            >
                                                <Translation id="TR_CONNECT_APP_SILENT_MODE" />
                                            </Checkbox>
                                        </Tooltip>
                                    )}
                                </Column>
                            </Card>
                        </>
                    )}
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
