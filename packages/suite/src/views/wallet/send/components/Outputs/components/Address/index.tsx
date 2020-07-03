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
    const {
        account,
        updateContext,
        composeTransaction,
        register,
        values,
        errors,
        setValue,
    } = useSendFormContext();
    const { descriptor, networkType, symbol } = account;
    const { openModal } = useActions({ openModal: modalActions.openModal });
    const error =
        errors.outputs && errors.outputs[outputId] ? errors.outputs[outputId].address : undefined;
    const addressValue =
        values.outputs && values.outputs[outputId] ? values.outputs[outputId].address : '';

    return (
        <Input
            state={getInputState(error, addressValue)}
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
                        addressValue,
                        symbol,
                    );
                    updateContext({ destinationAddressEmpty });
                }
                composeTransaction();
            }}
            bottomText={
                error ? (
                    <Translation id={error.message as any} />
                ) : (
                    <AddressLabeling address={addressValue} knownOnly />
                )
            }
            name={`outputs[${outputId}].address`}
            defaultValue={addressValue}
            innerRef={register({
                required: 'TR_ADDRESS_IS_NOT_SET',
                validate: (value: string) => {
                    if (!isAddressValid(value, symbol)) {
                        return 'TR_ADDRESS_IS_NOT_VALID';
                    }
                    if (networkType === 'ripple' && value === descriptor) {
                        return 'TR_XRP_CANNOT_SEND_TO_MYSELF';
                    }
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
