import { Translation } from '@suite-components/Translation';
import { AppState } from '@suite-types';
import styled from 'styled-components';
import { Icon, colors, Input, Tooltip } from '@trezor/components-v2';
import messages from '@suite/support/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Account, Network } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';
import { getAccountDevice, isAddressInAccount } from '@wallet-utils/accountUtils';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { Props } from './Container';

const StyledIcon = styled(Icon)`
    cursor: pointer;
    padding-left: 5px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const getMessage = (
    error: Output['address']['error'],
    networkType: Network['networkType'],
    address: Output['address']['value'],
    accounts: Account[],
    devices: AppState['devices'],
) => {
    if (address && error !== VALIDATION_ERRORS.CANNOT_SEND_TO_MYSELF) {
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

export default ({
    output,
    intl,
    account,
    accounts,
    devices,
    openModal,
    sendFormActions,
}: Props) => {
    if (!account) return null;

    const { networkType } = account;
    const { address, id } = output;
    const { value, error } = address;

    return (
        <Input
            state={getInputState(error, value)}
            display="block"
            monospace
            topLabel={
                <Label>
                    {intl.formatMessage(messages.TR_RECIPIENT_ADDRESS)}
                    <Tooltip
                        placement="top"
                        content={<Translation {...messages.TR_RECIPIENT_ADDRESS_TOOLTIP} />}
                    >
                        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
                    </Tooltip>
                </Label>
            }
            bottomText={getMessage(error, networkType, value, accounts, devices)}
            button={{
                icon: 'QR',
                onClick: () =>
                    openModal({
                        type: 'qr-reader',
                        outputId: id,
                    }),
                text: 'Scan',
            }}
            value={value || ''}
            onChange={e => sendFormActions.handleAddressChange(id, e.target.value)}
        />
    );
};
