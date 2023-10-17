import { useEffect, ReactNode } from 'react';
import styled from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, ConfirmOnDevice, ModalProps, useTheme } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { QrCode } from 'src/components/suite/QrCode';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation, Modal } from 'src/components/suite';
import { MODAL } from 'src/actions/suite/constants';
import { ThunkAction } from 'src/types/suite';
import { DeviceDisconnected } from './DeviceDisconnected';
import { TransactionReviewStepIndicator } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewStepIndicator';
import { TransactionReviewOutputElement } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';
import { SCREEN_SIZE } from '@trezor/components/src/config/variables';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 21px;
`;

const Content = styled.div`
    display: flex;
    gap: 21px;

    @media (max-width: ${SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 300px;

    @media (max-width: ${SCREEN_SIZE.MD}) {
        width: 100%;
    }
`;

const StyledQrCode = styled(QrCode)`
    border-radius: 12px;
    background: ${({ theme }) => theme.BG_GREY};
    padding: 32px;
    max-height: 100%;
    width: 300px;
`;

const StyledButton = styled(Button)`
    width: 100%;

    @media (max-width: ${SCREEN_SIZE.MD}) {
        margin-top: 24px;
    }
`;

const StyledModal = styled(Modal)`
    width: unset;

    /* Prevent resizing the modal when close icon appears */
    ${Modal.Header} {
        margin: ${({ isCancelable }) => !isCancelable && `0 ${Modal.closeIconWidth / 2}px`};
    }
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
    const state = addressConfirmed ? 'success' : 'active';
    const outputLines = [
        {
            id: 'address',
            label: <Translation id="TR_RECEIVE_ADDRESS" />,
            value,
            plainValue: true,
            confirmLabel: <Translation id="TR_RECEIVE_ADDRESS_MATCH" />,
        },
    ];

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
                {device && !device?.connected && <DeviceDisconnected label={device.label} />}
                <Content>
                    <StyledQrCode
                        value={value}
                        bgColor="transparent"
                        fgColor={addressConfirmed ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                        showMessage={!addressConfirmed}
                    />
                    <Right>
                        <TransactionReviewOutputElement
                            indicator={<TransactionReviewStepIndicator state={state} size={16} />}
                            lines={outputLines}
                            state={state}
                        />
                        {addressConfirmed && (
                            <StyledButton onClick={copy} data-test={copyButtonDataTest}>
                                {copyButtonText}
                            </StyledButton>
                        )}
                    </Right>
                </Content>
            </Wrapper>
        </StyledModal>
    );
};
