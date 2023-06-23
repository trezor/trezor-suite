import React from 'react';
import styled from 'styled-components';

import { Translation, Modal } from 'src/components/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { QrCode, QRCODE_PADDING, QRCODE_SIZE } from 'src/components/suite/QrCode';
import { TrezorDevice } from 'src/types/suite/index';
import { Button, ConfirmOnDevice, ModalProps, variables } from '@trezor/components';
import { getDeviceModel } from '@trezor/device-utils';
import { copyToClipboard } from '@trezor/dom-utils';
import DeviceDisconnected from './Address/components/DeviceDisconnected';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-self: center;
    gap: 20px;
`;

const Value = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-variant-numeric: tabular-nums slashed-zero;
    width: 100%;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 8px;
    word-break: break-all;
    padding: 10px;
    max-width: calc(${QRCODE_SIZE}px + ${QRCODE_PADDING * 2}px);
`;

const StyledButton = styled(Button)`
    align-self: center;
`;

const StyledModal = styled(Modal)`
    width: unset;

    /* Prevent resizing the modal when close icon appears */
    ${Modal.Header} {
        margin: ${({ isCancelable }) => !isCancelable && `0 ${Modal.closeIconWidth / 2}px`};
    }
`;

const StyledDeviceDisconnected = styled(DeviceDisconnected)`
    max-width: calc(${QRCODE_SIZE}px + ${QRCODE_PADDING * 2}px);
`;

export interface ConfirmDeviceScreenProps extends Pick<ModalProps, 'onCancel' | 'heading'> {
    device: TrezorDevice;
    copyButtonText: React.ReactNode;
    copyButtonDataTest?: string;
    isConfirmed?: boolean;
    value: string;
    valueDataTest?: string;
}

export const ConfirmValueOnDevice = ({
    copyButtonText,
    copyButtonDataTest,
    device,
    heading,
    isConfirmed,
    onCancel,
    value,
    valueDataTest,
}: ConfirmDeviceScreenProps) => {
    const dispatch = useDispatch();

    const showCopyButton = isConfirmed || !device.connected;

    const isActionAbortable = useSelector(selectIsActionAbortable) || showCopyButton;

    const copy = () => {
        const result = copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <StyledModal
            isCancelable={isActionAbortable}
            heading={heading}
            modalPrompt={
                device.connected ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModel={getDeviceModel(device)}
                        isConfirmed={isConfirmed}
                    />
                ) : undefined
            }
            onCancel={onCancel}
        >
            <Wrapper>
                {!device.connected && <StyledDeviceDisconnected label={device.label} />}
                <QrCode value={value} />
                <Value data-test={valueDataTest}>{value}</Value>
                {showCopyButton && (
                    <StyledButton variant="tertiary" onClick={copy} data-test={copyButtonDataTest}>
                        {copyButtonText}
                    </StyledButton>
                )}
            </Wrapper>
        </StyledModal>
    );
};
