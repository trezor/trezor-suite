import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';
import { Input } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { Account } from '@wallet-types';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

interface Props {
    outputId: number;
    networkType: Account['networkType'];
}

const getState = (errors, touched) => {
    if (!touched && Object.keys(errors).length !== 0) {
        return 'error';
    }
    return undefined;
};

export default ({ outputId, networkType }: Props) => {
    const inputName = `address-${outputId}`;
    const { register, errors, formState, getValues } = useFormContext();
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const touched = formState.touched[inputName];
    const error = errors && errors[inputName];

    return (
        <Input
            state={getState(errors, touched)}
            monospace
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_RECIPIENT_ADDRESS" />
                    </Text>
                    <QuestionTooltip messageId="TR_RECIPIENT_ADDRESS_TOOLTIP" />
                </Label>
            }
            bottomText={
                error ? (
                    <Translation id={error.type} />
                ) : (
                    <AddressLabeling address={getValues(inputName)} knownOnly />
                )
            }
            name={inputName}
            innerRef={register({
                validate: {
                    TR_ADDRESS_IS_NOT_SET: (value: string) => !touched && value.length !== 0,
                    // TR_ADDRESS_IS_NOT_VALID: () => {},
                    // TR_XRP_CANNOT_SEND_TO_MYSELF: () => {},
                },
            })}
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
