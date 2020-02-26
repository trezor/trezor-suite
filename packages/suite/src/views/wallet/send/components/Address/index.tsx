import { Translation, AddressLabeling } from '@suite-components';
import styled from 'styled-components';
import { Icon, colors, Input, Tooltip } from '@trezor/components';
import messages from '@suite/support/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Output } from '@wallet-types/sendForm';
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

const getErrorMessage = (error: Output['address']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation>{messages.TR_ADDRESS_IS_NOT_SET}</Translation>;
        case VALIDATION_ERRORS.NOT_VALID:
            return <Translation>{messages.TR_ADDRESS_IS_NOT_VALID}</Translation>;
        case VALIDATION_ERRORS.XRP_CANNOT_SEND_TO_MYSELF:
            return <Translation>{messages.TR_XRP_CANNOT_SEND_TO_MYSELF}</Translation>;
        default:
            return undefined;
    }
};

export default ({ output, account, openModal, sendFormActions }: Props) => {
    if (!account) return null;
    const { address, id } = output;
    const { value, error } = address;

    return (
        <Input
            state={getInputState(error, value)}
            display="block"
            monospace
            topLabel={
                <Label>
                    <Translation {...messages.TR_RECIPIENT_ADDRESS} />
                    <Tooltip
                        placement="top"
                        content={<Translation {...messages.TR_RECIPIENT_ADDRESS_TOOLTIP} />}
                    >
                        <StyledIcon size={16} color={colors.BLACK50} icon="QUESTION" />
                    </Tooltip>
                </Label>
            }
            bottomText={getErrorMessage(error) || <AddressLabeling address={value} knownOnly />}
            button={{
                icon: 'QR',
                onClick: () =>
                    openModal({
                        type: 'qr-reader',
                        outputId: id,
                    }),
                text: <Translation {...messages.TR_SCAN} />,
            }}
            value={value || ''}
            onChange={e => sendFormActions.handleAddressChange(id, e.target.value)}
        />
    );
};
