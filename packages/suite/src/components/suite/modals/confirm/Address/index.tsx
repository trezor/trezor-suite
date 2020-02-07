import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { Button, P, H2, colors } from '@trezor/components-v2';
import { copyToClipboard } from '@suite-utils/dom';
import { TrezorDevice, Dispatch } from '@suite-types';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import QRCode from './components/QRCode';
import CheckOnTrezor from './components/CheckOnTrezor';
import DeviceDisconnected from './components/DeviceDisconnected';

const Wrapper = styled.div`
    max-width: 600px;
    padding: 0px 48px;
`;

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
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addNotification: bindActionCreators(notificationActions.add, dispatch),
});

type Props = {
    device: TrezorDevice;
    address: string;
    addressPath?: string;
    networkType: string;
    symbol: string;
    onCancel?: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const ConfirmAddress = ({
    device,
    address,
    addressPath,
    networkType,
    symbol,
    addNotification,
}: Props) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;

    const copyAddress = () => {
        const result = copyToClipboard(address);
        if (typeof result === 'string') {
            addNotification({ type: 'copy-to-clipboard-error', error: result });
        } else {
            addNotification({ type: 'copy-to-clipboard-success', address });
        }
    };

    return (
        <Wrapper>
            <H2>
                <Translation
                    {...messages.TR_ADDRESS_MODAL_TITLE}
                    values={{ networkName: symbol.toUpperCase() }}
                />
            </H2>
            {networkType === 'bitcoin' && (
                <P size="tiny">
                    <Translation {...messages.TR_ADDRESS_MODAL_BTC_DESCRIPTION} />
                </P>
            )}
            <QRCode value={address} addressPath={addressPath} />
            <Address>{address}</Address>
            {device.connected && <CheckOnTrezor />}
            {!device.connected && <DeviceDisconnected label={device.label} />}
            <Row>
                <Button variant="secondary" onClick={copyAddress}>
                    <Translation {...messages.TR_ADDRESS_MODAL_CLIPBOARD} />
                </Button>
            </Row>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(ConfirmAddress);
