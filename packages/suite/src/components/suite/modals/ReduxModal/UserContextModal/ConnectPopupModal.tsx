import { useState } from 'react';

import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { Checkbox, Column, H2, NewModal, Paragraph } from '@trezor/components';
import { ERRORS } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const ConnectPopupModal = () => {
    const [isRemembered, setIsRemembered] = useState(false);

    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    if (!popupCall || popupCall?.state !== 'permission-request') return null;

    const { methodInfo, source } = popupCall;
    const { methodTitle, confirmLabel, permissionTypes } = methodInfo;

    const rememberPayload = {
        origin,
        types: permissionTypes,
        ...(source.isWalletConnect
            ? {
                  isWalletConnect: true as const,
                  appName: undefined,
                  appIcon: undefined,
                  processName: source.processName,
              }
            : {
                  isWalletConnect: false as const,
                  appName: source.manifest.appName,
                  appIcon: source.manifest.appIcon,
                  processName: source.processName,
              }),
    };
    const onConfirm = () => {
        if (isRemembered) dispatch(connectPopupActions.rememberAppPermissions(rememberPayload));
        dispatch(connectPopupActions.approvePermissions());
    };
    const onCancel = () =>
        dispatch(connectPopupActions.rejectPermissions(ERRORS.TypedError('Method_Cancel')));

    return (
        <NewModal
            onCancel={onCancel}
            iconName="plugs"
            variant="primary"
            bottomContent={
                <>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                    <NewModal.Button variant="primary" onClick={onConfirm}>
                        {confirmLabel || <Translation id="TR_CONFIRM" />}
                    </NewModal.Button>
                </>
            }
            heading={<Translation id="TR_TREZOR_CONNECT" />}
        >
            <Column gap={spacings.xs}>
                <H2 data-testid="@connect-popup-modal/header">{methodTitle}</H2>

                <Column>
                    <Paragraph data-testid="@connect-popup-modal/paragraph-process">
                        <Translation id="TR_CONNECT_MODAL_PROCESS" />{' '}
                        <strong>{source.processName}</strong>
                    </Paragraph>
                    <Paragraph data-testid="@connect-popup-modal/paragraph-origin">
                        <Translation id="TR_CONNECT_MODAL_WEB_ORIGIN" /> <strong>{origin}</strong>
                    </Paragraph>
                    {!source.isWalletConnect && (
                        <Paragraph>
                            <Translation id="TR_CONNECT_MODAL_APP_NAME" />{' '}
                            <strong>{source.manifest.appName}</strong>
                        </Paragraph>
                    )}
                </Column>

                <Paragraph variant="tertiary">
                    <Translation id="TR_CONNECT_MODAL_REQUEST_DESCRIPTION" />
                </Paragraph>

                {!source.isWalletConnect && (
                    <Checkbox
                        data-testid="@connect-popup-modal/remember-checkbox"
                        isChecked={isRemembered}
                        onClick={() => setIsRemembered(!isRemembered)}
                    >
                        <Translation id="TR_CONNECT_MODAL_REMEMBER" />
                    </Checkbox>
                )}
            </Column>
        </NewModal>
    );
};
