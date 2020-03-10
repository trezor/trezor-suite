import { Translation, AddressLabeling, QuestionTooltip } from '@suite-components';
import styled from 'styled-components';
import { Input } from '@trezor/components';
import messages from '@suite/support/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { Output } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { Props } from './Container';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const getErrorMessage = (error: Output['address']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation {...messages.TR_ADDRESS_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_VALID:
            return <Translation {...messages.TR_ADDRESS_IS_NOT_VALID} />;
        case VALIDATION_ERRORS.XRP_CANNOT_SEND_TO_MYSELF:
            return <Translation {...messages.TR_XRP_CANNOT_SEND_TO_MYSELF} />;
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
                    <Text>
                        <Translation {...messages.TR_RECIPIENT_ADDRESS} />
                    </Text>
                    <QuestionTooltip messageId="TR_RECIPIENT_ADDRESS_TOOLTIP" />
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
