import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';
import { Input } from '@trezor/components';
import { useActions } from '@suite-hooks';
import { isAddressValid } from '@wallet-utils/validation';
import * as modalActions from '@suite-actions/modalActions';
import { Account } from '@wallet-types';
import React from 'react';
import { useFormContext, FieldError, NestDataObject } from 'react-hook-form';
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
    account: Account;
}

const getState = (errors: NestDataObject<Record<string, any>, FieldError>, touched: boolean) => {
    if (!touched && Object.keys(errors).length !== 0) {
        return 'error';
    }
    return undefined;
};

export default ({ outputId, account }: Props) => {
    const inputName = `address-${outputId}`;
    const { descriptor, networkType, symbol } = account;
    const { register, errors, formState, getValues } = useFormContext();
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const touched = formState.touched[inputName] && formState.touched[inputName].length === 1;
    const inputErrors = errors ? errors[inputName] : [];

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
                inputErrors ? (
                    <Translation id={inputErrors.type} />
                ) : (
                    <AddressLabeling address={getValues(inputName)} knownOnly />
                )
            }
            name={inputName}
            innerRef={register({
                validate: {
                    TR_ADDRESS_IS_NOT_SET: (value: string) => !touched && value.length !== 0,
                    TR_ADDRESS_IS_NOT_VALID: value => {
                        if (networkType !== 'bitcoin') {
                            return isAddressValid(value, symbol);
                        }
                        return false;
                    },
                    TR_XRP_CANNOT_SEND_TO_MYSELF: async (value: string) => {
                        if (networkType === 'ripple') {
                            return value !== descriptor;
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
