import React, { createRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { Button, Modal, colors } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { TrezorDevice, Dispatch } from '@suite-types';
import { Translation, QrCode } from '@suite-components';

import CheckOnTrezor from './components/CheckOnTrezor';
import DeviceDisconnected from './components/DeviceDisconnected';

const Address = styled.div`
    width: 100%;
    background: ${colors.BLACK96};
    border: 1px solid ${colors.BLACK80};
    border-radius: 6px;
    word-break: break-all;
    font-size: 20px;
    padding: 20px;
    margin-bottom: 40px;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;

    button + button {
        margin-top: 10px;
    }
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addNotification: bindActionCreators(notificationActions.addToast, dispatch),
});

type Props = {
    device: TrezorDevice;
    address: string;
    addressPath?: string;
    networkType: string;
    symbol: string;
    cancelable?: boolean;
    onCancel?: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const ConfirmAddress = ({
    device,
    address,
    addressPath,
    networkType,
    symbol,
    addNotification,
    cancelable,
    onCancel,
}: Props) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;

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
            description={
                networkType === 'bitcoin' ? (
                    <Translation id="TR_ADDRESS_MODAL_BTC_DESCRIPTION" />
                ) : undefined
            }
            cancelable={cancelable}
            onCancel={onCancel}
            size="small"
        >
            <QrCode value={address} addressPath={addressPath} />
            <Address data-test="@address-modal/address-field">{address}</Address>
            {device.connected && <CheckOnTrezor device={device} />}
            {!device.connected && <DeviceDisconnected label={device.label} />}
            <Row ref={htmlElement}>
                <Button variant="primary" onClick={copyAddress}>
                    <Translation id="TR_ADDRESS_MODAL_CLIPBOARD" />
                </Button>
            </Row>
        </Modal>
    );
};

export default connect(null, mapDispatchToProps)(ConfirmAddress);
