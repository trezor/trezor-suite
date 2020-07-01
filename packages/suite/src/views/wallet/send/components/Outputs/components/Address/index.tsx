import React from 'react';
import styled from 'styled-components';
import { Input } from '@trezor/components';

import * as modalActions from '@suite-actions/modalActions';
import { checkRippleEmptyAddress } from '@wallet-actions/sendFormActions';
import { useActions } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import { isAddressValid } from '@wallet-utils/validation';
import { getInputState } from '@wallet-utils/sendFormUtils';

import { AddressLabeling, QuestionTooltip, Translation } from '@suite-components';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    margin-right: 3px;
`;

export default ({ outputId }: { outputId: number }) => {
    const { formContext, sendContext, composeTransaction } = useSendFormContext();
    const { register, errors, getValues, formState, setValue } = formContext;
    const { account, updateContext } = sendContext;
    const inputName = `address[${outputId}]`;
    const isDirty = formState.dirtyFields.has(inputName);
    const { descriptor, networkType, symbol } = account;
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const error = errors && errors.address ? errors.address[outputId] : undefined;
    const addressValue = getValues(inputName);

    return (
        <Input
            state={getInputState(error, isDirty, addressValue)}
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
                if (error) return;

                if (networkType === 'ripple') {
                    const destinationAddressEmpty = await checkRippleEmptyAddress(
                        getValues(inputName),
                        account.symbol,
                    );
                    updateContext({ destinationAddressEmpty });
                }
                composeTransaction();
            }}
            bottomText={
                error ? error.message : <AddressLabeling address={getValues(inputName)} knownOnly />
            }
            name={inputName}
            innerRef={register({
                validate: {
                    notSet: (value: string) => {
                        if (isDirty && value.length === 0) {
                            return <Translation id="TR_ADDRESS_IS_NOT_SET" />;
                        }
                    },
                    notValid: (value: string) => {
                        if (value && !isAddressValid(value, symbol)) {
                            return <Translation id="TR_ADDRESS_IS_NOT_VALID" />;
                        }
                    },
                    xrpCannotSendMyself: (value: string) => {
                        if (networkType === 'ripple' && value === descriptor) {
                            return <Translation id="TR_XRP_CANNOT_SEND_TO_MYSELF" />;
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
