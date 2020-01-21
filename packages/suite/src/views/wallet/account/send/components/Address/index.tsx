import { Translation } from '@suite-components/Translation';
import { AppState } from '@suite-types';
import styled from 'styled-components';
import { Icon, colors, Input } from '@trezor/components-v2';
import messages from '@suite/support/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Account, Network } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';
import { getAccountDevice, isAddressInAccount } from '@wallet-utils/accountUtils';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { DispatchProps } from '../../Container';

const StyledIcon = styled(Icon)`
    cursor: pointer;
    padding-left: 5px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

interface Props extends WrappedComponentProps {
    outputId: Output['id'];
    error: Output['address']['error'];
    networkType: Network['networkType'];
    devices: AppState['devices'];
    accounts: Account[];
    address: Output['address']['value'];
    sendFormActions: DispatchProps['sendFormActions'];
    openModal: DispatchProps['openModal'];
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
            return <Translation>{messages.TR_CANNOT_SEND_TO_MYSELF}</Translation>;
        default:
            return undefined;
    }
};

const Address = (props: Props) => (
    <Input
        state={getInputState(props.error, props.address)}
        display="block"
        monospace
        topLabel={
            <Label>
                {props.intl.formatMessage(messages.TR_RECIPIENT_ADDRESS)}
                <StyledIcon size={12} color={colors.BLACK50} icon="QUESTION" />
            </Label>
        }
        bottomText={getMessage(
            props.error,
            props.networkType,
            props.address,
            props.accounts,
            props.devices,
        )}
        button={{
            icon: 'QR',
            onClick: () =>
                props.openModal({
                    type: 'qr-reader',
                    outputId: props.outputId,
                }),
            text: 'Scan',
        }}
        value={props.address || ''}
        onChange={e => props.sendFormActions.handleAddressChange(props.outputId, e.target.value)}
    />
);

export default injectIntl(Address);
