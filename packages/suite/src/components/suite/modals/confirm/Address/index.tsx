import React, { createRef } from 'react';
import styled from 'styled-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { Button, Modal, variables, ConfirmOnDevice, Box } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { TrezorDevice } from '@suite-types';
import { Translation, QrCode } from '@suite-components';
import DeviceDisconnected from './components/DeviceDisconnected';
import { useActions } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-self: center;
`;

const StyledBox = styled(Box)`
    flex-direction: row;
    padding: 30px 24px;
    align-self: center;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
`;

const Address = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    border-radius: 6px;
    word-break: break-all;
    font-variant-numeric: tabular-nums slashed-zero;
    text-align: left;
`;

const CopyButtonWrapper = styled.div`
    display: flex;
    margin-top: 14px;
`;

type Props = {
    device: TrezorDevice;
    address: string;
    symbol: string;
    cancelable?: boolean;
    confirmed?: boolean;
    onCancel?: () => void;
};

const ConfirmAddress = ({ device, address, symbol, cancelable, confirmed, onCancel }: Props) => {
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
            // size="large"
            useFixedWidth={false}
        >
            <Wrapper>
                <StyledBox>
                    <QrCode value={address} />
                    <Right>
                        <Address data-test="@modal/confirm-address/address-field">
                            {address}
                        </Address>
                        {confirmed && (
                            <CopyButtonWrapper ref={htmlElement}>
                                <Button
                                    data-test="@metadata/copy-address-button"
                                    variant="tertiary"
                                    onClick={copyAddress}
                                >
                                    <Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />
                                </Button>
                            </CopyButtonWrapper>
                        )}
                    </Right>
                </StyledBox>
                {!device.connected && <DeviceDisconnected label={device.label} />}
            </Wrapper>
        </Modal>
    );
};

export default ConfirmAddress;
