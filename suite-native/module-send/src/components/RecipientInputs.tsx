import React from 'react';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack, Text, CardDivider } from '@suite-native/atoms';
import { TextInputField } from '@suite-native/forms';
import { AccountKey } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import { AmountInputs } from './AmountInputs';
import { getOutputFieldName } from '../utils';

type RecipientInputsProps = {
    index: number;
    accountKey: AccountKey;
};
export const RecipientInputs = ({ index, accountKey }: RecipientInputsProps) => {
    const addressFieldName = getOutputFieldName(index, 'address');

    return (
        <VStack spacing="medium">
            <VStack spacing={12}>
                <Text variant="hint">
                    <Translation id="moduleSend.outputs.recipients.addressLabel" />
                </Text>
                <TextInputField
                    multiline
                    name={addressFieldName}
                    testID={addressFieldName}
                    maxLength={formInputsMaxLength.address}
                    accessibilityLabel="address input"
                />
            </VStack>
            <CardDivider />
            <AmountInputs index={index} accountKey={accountKey} />
        </VStack>
    );
};
