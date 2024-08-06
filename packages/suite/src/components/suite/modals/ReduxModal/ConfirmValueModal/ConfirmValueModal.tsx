import { useEffect, ReactNode } from 'react';
import styled from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Button, ConfirmOnDevice, ModalProps, Tooltip, variables } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { selectDevice } from '@suite-common/wallet-core';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { QrCode } from 'src/components/suite/QrCode';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation, Modal } from 'src/components/suite';
import { MODAL } from 'src/actions/suite/constants';
import { DisplayMode, ThunkAction } from 'src/types/suite';
import { DeviceDisconnected } from './DeviceDisconnected';
import { TransactionReviewStepIndicator } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewStepIndicator';
import { TransactionReviewOutputElement } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';
import { Account } from '@suite-common/wallet-types';
import { borders, palette } from '@trezor/theme';
import { getNetworkFeatures } from '@suite-common/wallet-config';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 21px;
`;

const Content = styled.div`
    display: flex;
    gap: 21px;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
    }
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    width: 300px;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        width: 100%;
    }
`;

const StyledQrCode = styled(QrCode)`
    border-radius: ${borders.radii.sm};
    padding: 32px;
    max-height: 100%;
    width: 300px;
`;

const StyledButton = styled(Button)`
    width: 100%;
    margin-top: 24px;
`;

const StyledModal = styled(Modal)`
    width: unset;

    /* Prevent resizing the modal when close icon appears */
    ${Modal.Header} {
        margin: ${({ isCancelable }) => !isCancelable && `0 ${Modal.closeIconWidth / 2}px`};
    }
`;

export interface ConfirmValueModalProps extends Pick<ModalProps, 'onCancel' | 'heading'> {
    account: Account;
    copyButtonText: ReactNode;
    stepLabel: ReactNode;
    confirmStepLabel: ReactNode;
    copyButtonDataTest?: string;
    isConfirmed?: boolean;
    validateOnDevice: () => ThunkAction;
    value: string;
    displayMode: DisplayMode;
}

export const ConfirmValueModal = ({
    account,
    copyButtonText,
    copyButtonDataTest,
    stepLabel,
    confirmStepLabel,
    heading,
    isConfirmed,
    onCancel,
    validateOnDevice,
    value,
    displayMode,
}: ConfirmValueModalProps) => {
    const device = useSelector(selectDevice);
    const modalContext = useSelector(state => state.modal.context);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const dispatch = useDispatch();

    const canConfirmOnDevice = !!(device?.connected && device?.available);
    const addressConfirmed = isConfirmed || !canConfirmOnDevice;
    const isCancelable = isActionAbortable || addressConfirmed;
    const state = addressConfirmed ? 'success' : 'active';
    const outputLines = [
        {
            id: 'address',
            label: stepLabel,
            value,
            plainValue: true,
            confirmLabel: confirmStepLabel,
        },
    ];
    const showTokensSubheading = getNetworkFeatures(account.symbol).includes('tokens');

    const copy = () => {
        const result = copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    const buttonTooltipContent = () => {
        if (!addressConfirmed) {
            return <Translation id="TR_CONFIRM_BEFORE_COPY" />;
        }

        return null;
    };

    // Device connected while the modal is open -> validate on device.
    useEffect(() => {
        if (canConfirmOnDevice && modalContext === MODAL.CONTEXT_USER && !isConfirmed) {
            dispatch(validateOnDevice());
        }
    }, [canConfirmOnDevice, dispatch, isConfirmed, modalContext, validateOnDevice]);

    // QR code needs constant colors, not light/dark theme colors
    const qrCodeFgColor = addressConfirmed ? palette.lightGray1000 : palette.lightGray700;

    return (
        <StyledModal
            isCancelable={isCancelable}
            heading={heading}
            subheading={showTokensSubheading && <Translation id="TR_INCLUDING_TOKENS" />}
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
                        fgColor={qrCodeFgColor}
                        showMessage={!addressConfirmed}
                    />
                    <Right>
                        <TransactionReviewOutputElement
                            indicator={<TransactionReviewStepIndicator state={state} size={16} />}
                            lines={outputLines}
                            state={state}
                            account={account}
                            displayMode={displayMode}
                        />
                        <Tooltip content={buttonTooltipContent()}>
                            <StyledButton
                                isDisabled={!addressConfirmed}
                                onClick={copy}
                                data-test={copyButtonDataTest}
                            >
                                {copyButtonText}
                            </StyledButton>
                        </Tooltip>
                    </Right>
                </Content>
            </Wrapper>
        </StyledModal>
    );
};
