import { useState } from 'react';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { CALL_SOURCE_WALLETCONNECT } from '@suite-common/connect-popup/src/connectPopupTypes';
import {
    Card,
    Checkbox,
    Column,
    Icon,
    IconCircle,
    List,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { ERRORS } from '@trezor/connect';
import { EventTypeShared, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { ConnectProcessLabel } from 'src/components/suite/ConnectProcessLabel';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getPermissionText } from 'src/views/settings/SettingsConnectedApps/ConnectPermissions';

export const ConnectPermissionsModal = () => {
    const [isRemembered, setIsRemembered] = useState(false);

    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    if (!popupCall || popupCall?.state !== 'permission-request') return null;

    const { method, methodInfo, source } = popupCall;
    const { confirmLabel, permissionTypes } = methodInfo;

    const rememberPayload = {
        types: permissionTypes,
        ...source,
    };
    const onConfirm = () => {
        if (isRemembered) {
            dispatch(connectPopupActions.rememberAppPermissions(rememberPayload));
        }
        dispatch(connectPopupActions.approvePermissions());
        analytics.report({
            type: EventTypeShared.ConnectPopupPermissions,
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
            type: EventTypeShared.ConnectPopupPermissions,
            payload: {
                method,
                origin: source.origin,
                approved: false,
            },
        });
    };

    return (
        <Modal
            onCancel={onCancel}
            bottomContent={
                <>
                    <Modal.Button
                        variant="primary"
                        onClick={onConfirm}
                        data-testid="@connect-permissions-modal/confirm-button"
                    >
                        {confirmLabel || <Translation id="TR_CONFIRM" />}
                    </Modal.Button>
                    <Modal.Button
                        variant="tertiary"
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
                        <IconCircle
                            name={
                                source.type === CALL_SOURCE_WALLETCONNECT
                                    ? 'walletConnect'
                                    : 'plugs'
                            }
                            size={spacings.xxxxl}
                            paddingType="large"
                            variant="tertiary"
                            hasBorder={false}
                        />

                        <Column gap={spacings.xxs}>
                            <Row gap={spacings.sm}>
                                {source.manifest?.appName ? (
                                    <>
                                        <Text>{source.manifest.appName}</Text>
                                        <Text variant="tertiary">{source.origin}</Text>
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
                                bulletComponent={<Icon name="checkCircle" variant="primary" />}
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
                            <Checkbox
                                data-testid="@connect-permissions-modal/remember-checkbox"
                                isChecked={isRemembered}
                                onClick={() => setIsRemembered(!isRemembered)}
                            >
                                <Translation id="TR_CONNECT_MODAL_REMEMBER" />
                            </Checkbox>
                        </Card>
                    </>
                )}
            </Column>
        </Modal>
    );
};
