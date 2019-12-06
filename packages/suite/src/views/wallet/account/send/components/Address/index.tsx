import { Translation } from '@suite-components/Translation';
import { AppState } from '@suite-types';
import messages from '@suite/support/messages';
import { colors, Icon, Input } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Account, Network } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';
import { getAccountDevice, isAddressInAccount } from '@wallet-utils/accountUtils';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';

import { DispatchProps } from '../../Container';

const TopLabel = styled.div``;

const QrButton = styled(Button)`
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left: 0px;
    height: 40px;
    padding: 0 10px;
`;

interface Props extends WrappedComponentProps {
    outputId: Output['id'];
    error: Output['address']['error'];
    networkType: Network['networkType'];
    devices: AppState['devices'];
    accounts: Account[];
    address: Output['address']['value'];
    sendFormActions: DispatchProps['sendFormActions'];
    openQrModal: DispatchProps['openQrModal'];
}

const getMessage = (
    error: Output['address']['error'],
    networkType: Network['networkType'],
    address: string | null,
    accounts: Account[],
    devices: AppState['devices'],
) => {
    if (address && !VALIDATION_ERRORS.CANNOT_SEND_TO_MYSELF) {
        const account = isAddressInAccount(networkType, address, accounts);
        if (account) {
            const device = getAccountDevice(devices, account);
            if (device) {
                return `${device.label} Account #${account.index + 1}`;
            }
        }
    }

    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation>{messages.TR_ADDRESS_IS_NOT_SET}</Translation>;
        case VALIDATION_ERRORS.NOT_VALID:
            return <Translation>{messages.TR_ADDRESS_IS_NOT_VALID}</Translation>;
        case VALIDATION_ERRORS.CANNOT_SEND_TO_MYSELF:
            return <Translation>{messages.CANNOT_SEND_TO_MYSELF}</Translation>;
        default:
            return null;
    }
};

const getState = (error: Output['address']['error'], address: Output['address']['value']) => {
    if (error) {
        return 'error';
    }
    if (address && !error) {
        return 'success';
    }
};

const Address = (props: Props) => (
    <Input
        state={getState(props.error, props.address)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize="off"
        topLabel={<TopLabel>{props.intl.formatMessage(messages.TR_ADDRESS)}</TopLabel>}
        bottomText={getMessage(
            props.error,
            props.networkType,
            props.address,
            props.accounts,
            props.devices,
        )}
        value={props.address || ''}
        onChange={e => props.sendFormActions.handleAddressChange(props.outputId, e.target.value)}
        sideAddons={
            <QrButton
                key="qrButton"
                variant="secondary"
                onClick={() => props.openQrModal(props.outputId)}
            >
                <Icon size={25} color={colors.TEXT_SECONDARY} icon="QRCODE" />
            </QrButton>
        }
    />
);

export default injectIntl(Address);
