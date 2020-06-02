import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';
import { Input } from '@trezor/components';
import { useActions } from '@suite-hooks';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import * as modalActions from '@suite-actions/modalActions';
import { Output } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import { Props } from './Container';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const getErrorMessage = (error: Output['address']['error'], isLoading: boolean) => {
    if (isLoading && !error) return 'Loading'; // TODO loader or text?

    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <Translation id="TR_ADDRESS_IS_NOT_SET" />;
        case VALIDATION_ERRORS.NOT_VALID:
            return <Translation id="TR_ADDRESS_IS_NOT_VALID" />;
        case VALIDATION_ERRORS.XRP_CANNOT_SEND_TO_MYSELF:
            return <Translation id="TR_XRP_CANNOT_SEND_TO_MYSELF" />;
        default:
            return undefined;
    }
};

export default ({ outputId }: Props) => {
    const { register } = useFormContext();
    const openModal = useActions(modalActions.openModal);
    // const { address, id } = output;
    // let showLoadingForCompose = false;
    // const { value, error } = address;

    // if (isComposing && account.networkType === 'bitcoin') {
    //     showLoadingForCompose = true;
    // }

    return (
        <Input
            // state={getInputState(error, value, showLoadingForCompose, true)}
            monospace
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_RECIPIENT_ADDRESS" />
                    </Text>
                    <QuestionTooltip messageId="TR_RECIPIENT_ADDRESS_TOOLTIP" />
                </Label>
            }
            // bottomText={

            //         // getErrorMessage(error, isComposing) || <AddressLabeling address={value} knownOnly />

            // }
            name={`address-${outputId}`}
            innerRef={register}
            button={{
                icon: 'QR',
                onClick: () =>
                    openModal({
                        type: 'qr-reader',
                        outputId,
                    }),
                text: <Translation id="TR_SCAN" />,
            }}
        />
    );
};
