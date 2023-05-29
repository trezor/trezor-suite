import React from 'react';
import styled from 'styled-components';

import { Translation, Modal } from '@suite-components';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useDispatch } from '@suite-hooks';
import { QrCode, QRCODE_PADDING, QRCODE_SIZE } from '@suite-components/QrCode';
import { TrezorDevice } from '@suite-types/index';
import { Button, ConfirmOnDevice, ModalProps, variables } from '@trezor/components';
import { getDeviceModel } from '@trezor/device-utils';
import { copyToClipboard } from '@trezor/dom-utils';
import DeviceDisconnected from './Address/components/DeviceDisconnected';

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
`;

const StyledDeviceDisconnected = styled(DeviceDisconnected)`
    max-width: calc(${QRCODE_SIZE}px + ${QRCODE_PADDING * 2}px);
`;

export interface ConfirmDeviceScreenProps
    extends Pick<ModalProps, 'heading' | 'isCancelable' | 'onCancel'> {
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
    isCancelable,
    isConfirmed,
    onCancel,
    value,
    valueDataTest,
}: ConfirmDeviceScreenProps) => {
    const showCopyButton = isConfirmed || !device.connected;
    const dispatch = useDispatch();

    const copy = () => {
        const result = copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <StyledModal
            heading={heading}
            modalPrompt={
                device.connected ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModel={getDeviceModel(device)}
                        onCancel={isCancelable ? onCancel : undefined}
                        isConfirmed={isConfirmed}
                    />
                ) : undefined
            }
            isCancelable={isCancelable}
            onCancel={onCancel}
        >
            <Wrapper>
                <QrCode value={value} />
                <Value data-test={valueDataTest}>{value}</Value>
                {showCopyButton && (
                    <StyledButton variant="tertiary" onClick={copy} data-test={copyButtonDataTest}>
                        {copyButtonText}
                    </StyledButton>
                )}
                {!device.connected && <StyledDeviceDisconnected label={device.label} />}
            </Wrapper>
        </StyledModal>
    );
};
