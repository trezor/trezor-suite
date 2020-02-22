import React, { createRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { Button, P, H2, colors } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { TrezorDevice, Dispatch } from '@suite-types';
import { Translation, QrCode } from '@suite-components';
import messages from '@suite/support/messages';
import CheckOnTrezor from './components/CheckOnTrezor';
import DeviceDisconnected from './components/DeviceDisconnected';

const StyledWrapper = styled.div`
    max-width: 600px;
    padding: 40px;
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
    justify-content: center;

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

    const htmlElement = createRef<HTMLDivElement>();

    const copyAddress = () => {
        const result = copyToClipboard(address, htmlElement.current);
        if (typeof result === 'string') {
            addNotification({ type: 'copy-to-clipboard-error', error: result });
        } else {
            addNotification({ type: 'copy-to-clipboard-success', payload: address });
        }
    };

    return (
        <StyledWrapper>
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
            <QrCode value={address} addressPath={addressPath} />
            <Address data-test="@address-modal/address-field">{address}</Address>
            {device.connected && <CheckOnTrezor device={device} />}
            {!device.connected && <DeviceDisconnected label={device.label} />}
            <Row ref={htmlElement}>
                <Button variant="secondary" onClick={copyAddress}>
                    <Translation {...messages.TR_ADDRESS_MODAL_CLIPBOARD} />
                </Button>
            </Row>
        </StyledWrapper>
    );
};

export default connect(null, mapDispatchToProps)(ConfirmAddress);
