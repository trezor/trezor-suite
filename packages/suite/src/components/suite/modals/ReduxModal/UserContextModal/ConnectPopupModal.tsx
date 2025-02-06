import { connectPopupActions, selectConnectPopupCall } from '@suite-common/connect-popup';
import { H2, NewModal, Paragraph } from '@trezor/components';
import { ERRORS } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const ConnectPopupModal = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    if (!popupCall || popupCall?.state !== 'request') return null;

    const { methodTitle, confirmLabel, processName, origin } = popupCall;
    const onConfirm = () => dispatch(connectPopupActions.approveCall());
    const onCancel = () =>
        dispatch(connectPopupActions.rejectCall(ERRORS.TypedError('Method_Cancel')));

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
            <H2>{methodTitle}</H2>

            {processName && (
                <Paragraph margin={{ top: spacings.xs }}>
                    <Translation id="TR_CONNECT_MODAL_PROCESS" /> <strong>{processName}</strong>
                </Paragraph>
            )}
            {origin && (
                <Paragraph>
                    <Translation id="TR_CONNECT_MODAL_WEB_ORIGIN" /> <strong>{origin}</strong>
                </Paragraph>
            )}

            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id="TR_CONNECT_MODAL_REQUEST_DESCRIPTION" />
            </Paragraph>
        </NewModal>
    );
};
