import React, { createRef } from 'react';
import styled from 'styled-components';

import * as notificationActions from '@suite-actions/notificationActions';
import { Button, variables, ConfirmOnDevice } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { TrezorDevice } from '@suite-types';
import { Translation, Modal } from '@suite-components';
import { useActions } from '@suite-hooks';
import DeviceDisconnected from './components/DeviceDisconnected';
import { QrCode, QRCODE_PADDING, QRCODE_SIZE } from '@suite-components/QrCode';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-self: center;
    padding: 30px 24px;
`;

const Address = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-variant-numeric: tabular-nums slashed-zero;
    margin-bottom: 20px;
    width: 100%;
    background: ${props => props.theme.BG_LIGHT_GREY};
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 8px;
    word-break: break-all;
    padding: 10px;
    max-width: calc(${QRCODE_SIZE}px + ${QRCODE_PADDING * 2}px);
`;

const CopyButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
    height: 23px; /* height of tertiary button */
`;

const StyledDeviceDisconnected = styled(DeviceDisconnected)`
    max-width: calc(${QRCODE_SIZE}px + ${QRCODE_PADDING * 2}px);
`;

type ConfirmAddressProps = {
    device: TrezorDevice;
    address: string;
    symbol: string;
    cancelable?: boolean;
    confirmed?: boolean;
    onCancel?: () => void;
};

const ConfirmAddress = ({
    device,
    address,
    symbol,
    cancelable,
    confirmed,
    onCancel,
}: ConfirmAddressProps) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;

    const { addNotification } = useActions({ addNotification: notificationActions.addToast });
    const htmlElement = createRef<HTMLDivElement>();

    const copyAddress = () => {
        const result = copyToClipboard(address, htmlElement.current);
        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
        }
    };

    return (
        <Modal
            heading={
                <Translation
                    id="TR_ADDRESS_MODAL_TITLE"
                    values={{ networkName: symbol.toUpperCase() }}
                />
            }
            header={
                device.connected ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device.features?.major_version === 1 ? 1 : 2}
                        onCancel={cancelable ? onCancel : undefined}
                        animated
                        animation={confirmed ? 'SLIDE_DOWN' : 'SLIDE_UP'}
                    />
                ) : undefined
            }
            cancelable={cancelable}
            onCancel={onCancel}
            useFixedWidth={false}
        >
            <Wrapper>
                <QrCode value={address} />
                <Address data-test="@modal/confirm-address/address-field">{address}</Address>
                {device.connected && (
                    <CopyButtonWrapper ref={htmlElement}>
                        {confirmed && (
                            <Button
                                data-test="@metadata/copy-address-button"
                                variant="tertiary"
                                onClick={copyAddress}
                            >
                                <Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />
                            </Button>
                        )}
                    </CopyButtonWrapper>
                )}
                {!device.connected && <StyledDeviceDisconnected label={device.label} />}
            </Wrapper>
        </Modal>
    );
};

export default ConfirmAddress;
