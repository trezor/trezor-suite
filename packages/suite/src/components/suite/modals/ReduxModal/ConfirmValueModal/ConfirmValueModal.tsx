import { useEffect, ReactNode } from 'react';
import styled from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, ConfirmOnDevice, ModalProps, useTheme, variables } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { QrCode, QRCODE_PADDING, QRCODE_SIZE } from 'src/components/suite/QrCode';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation, Modal } from 'src/components/suite';
import { MODAL } from 'src/actions/suite/constants';
import { ThunkAction } from 'src/types/suite';
import { DeviceDisconnected } from './DeviceDisconnected';

const Wrapper = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
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

const StyledQrCode = styled(QrCode)`
    border-radius: 12px;
    background: ${({ theme }) => theme.BG_GREY};
    padding: 32px;
    max-height: 100%;
    margin-right: 21px;
    width: 300px;
`;

const StyledButton = styled(Button)`
    width: 100%;
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

export interface ConfirmValueModalProps extends Pick<ModalProps, 'onCancel' | 'heading'> {
    copyButtonText: ReactNode;
    copyButtonDataTest?: string;
    isConfirmed?: boolean;
    validateOnDevice: () => ThunkAction;
    value: string;
    valueDataTest?: string;
}

export const ConfirmValueModal = ({
    copyButtonText,
    copyButtonDataTest,
    heading,
    isConfirmed,
    onCancel,
    validateOnDevice,
    value,
    valueDataTest,
}: ConfirmValueModalProps) => {
    const device = useSelector(selectDevice);
    const modalContext = useSelector(state => state.modal.context);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const dispatch = useDispatch();
    const theme = useTheme();

    const canConfirmOnDevice = !!(device?.connected && device?.available);
    const addressConfirmed = isConfirmed || !canConfirmOnDevice;
    const isCancelable = isActionAbortable || addressConfirmed;

    const copy = () => {
        const result = copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    // Device connected while the modal is open -> validate on device.
    useEffect(() => {
        if (canConfirmOnDevice && modalContext === MODAL.CONTEXT_USER && !isConfirmed) {
            dispatch(validateOnDevice());
        }
    }, [canConfirmOnDevice, dispatch, isConfirmed, modalContext, validateOnDevice]);

    return (
        <StyledModal
            isCancelable={isCancelable}
            heading={heading}
            modalPrompt={
                canConfirmOnDevice ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={device.features?.internal_model}
                        deviceUnitColor={device?.features?.unit_color}
                        isConfirmed={isConfirmed}
                    />
                ) : undefined
            }
            onCancel={onCancel}
        >
            <Wrapper>
                {device && !device?.connected && <StyledDeviceDisconnected label={device.label} />}
                <StyledQrCode
                    value={value}
                    bgColor="transparent"
                    fgColor={addressConfirmed ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                    showMessage={!addressConfirmed}
                />
                <Right>
                    <Value data-test={valueDataTest}>{value}</Value>

                    {addressConfirmed && (
                        <StyledButton onClick={copy} data-test={copyButtonDataTest}>
                            {copyButtonText}
                        </StyledButton>
                    )}
                </Right>
            </Wrapper>
        </StyledModal>
    );
};
