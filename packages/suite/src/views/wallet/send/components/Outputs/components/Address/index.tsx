import * as modalActions from '@suite-actions/modalActions';
import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { Input } from '@trezor/components';
import { checkRippleEmptyAddress } from '@wallet-actions/sendFormActions';
import { isAddressValid } from '@wallet-utils/validation';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

export default ({ outputId }: { outputId: number }) => {
    const { account, setDestinationAddressEmpty } = useSendContext();
    const { register, errors, getValues, formState, setValue } = useFormContext();
    const inputName = `address-${outputId}`;
    const isDirty = formState.dirtyFields.has(inputName);
    const { descriptor, networkType, symbol } = account;
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const error = errors[inputName];

    return (
        <Input
            state={getInputState(error, isDirty)}
            monospace
            topLabel={
                <Label>
                    <Text>
                        <Translation id="TR_RECIPIENT_ADDRESS" />
                    </Text>
                    <QuestionTooltip messageId="TR_RECIPIENT_ADDRESS_TOOLTIP" />
                </Label>
            }
            onChange={async () => {
                if (!error && networkType === 'ripple') {
                    await checkRippleEmptyAddress(
                        account.symbol,
                        inputName,
                        getValues,
                        setDestinationAddressEmpty,
                    );
                }
            }}
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
                    TR_ADDRESS_IS_NOT_SET: (value: string) => !(isDirty && value.length === 0),
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
                        setValue,
                    }),
                text: <Translation id="TR_SCAN" />,
            }}
        />
    );
};
