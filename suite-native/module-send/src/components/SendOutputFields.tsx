import { useFieldArray } from 'react-hook-form';

import { formInputsMaxLength } from '@suite-common/validators';
import { VStack } from '@suite-native/atoms';
import { TextInputField, useFormContext } from '@suite-native/forms';

const amountTransformer = (value: string) =>
    value
        .replace(/[^0-9\.]/g, '') // remove all non-numeric characters
        .replace(/^\./g, '') // remove '.' symbol if it is not preceded by number
        .replace(/(?<=\..*)\./g, '') // keep only first appearance of the '.' symbol
        .replace(/(?<=^0+)0/g, ''); // remove all leading zeros except the first one

export const SendOutputFields = () => {
    const { control } = useFormContext();
    const outputs = useFieldArray({ control, name: 'outputs' });

    return (
        <>
            {outputs.fields.map((output, index) => (
                <VStack key={output.id}>
                    <TextInputField
                        multiline
                        label="Address"
                        name={`outputs.${index}.address`}
                        maxLength={formInputsMaxLength.address}
                        accessibilityLabel="address input"
                        autoCapitalize="none"
                        testID="@send/address-input"
                    />
                    <TextInputField
                        label="Amount to send"
                        name={`outputs.${index}.amount`}
                        keyboardType="numeric"
                        accessibilityLabel="amount to send input"
                        testID="@send/amount-input"
                        valueTransformer={amountTransformer}
                    />
                </VStack>
            ))}
            {/* 
              TODO: add output (outputs.append({...})) button
              issue: https://github.com/trezor/trezor-suite/issues/12944 
            */}
        </>
    );
};
