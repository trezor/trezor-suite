import * as modalActions from '@suite-actions/modalActions';
import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { Input } from '@trezor/components';
import { isAddressValid } from '@wallet-utils/validation';
import React from 'react';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const getState = (error: NestDataObject<Record<string, any>, FieldError>, touched: boolean) => {
    if (touched && !error) {
        return 'success';
    }

    if (error) {
        return 'error';
    }

    return undefined;
};

export default ({ outputId }: { outputId: number }) => {
    const { account } = useSendContext();
    const { register, errors, getValues, formState } = useFormContext();
    const inputName = `address-${outputId}`;
    const touched = formState.dirtyFields.has(inputName);
    const { descriptor, networkType, symbol } = account;
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const error = errors[inputName];

    return (
        <Input
            state={getState(error, touched)}
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
                    TR_ADDRESS_IS_NOT_SET: (value: string) => !(touched && value.length === 0),
                    TR_ADDRESS_IS_NOT_VALID: (value: string) => isAddressValid(value, symbol),
                    TR_XRP_CANNOT_SEND_TO_MYSELF: (value: string) => {
                        if (networkType === 'ripple') {
                            return !(value === descriptor);
                        }
                    },
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
