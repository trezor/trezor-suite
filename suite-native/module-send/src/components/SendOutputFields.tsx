import { useFieldArray } from 'react-hook-form';

import { Card, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { AccountKey } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';

import { RecipientInputs } from './RecipientInputs';

type SendOutputFieldsProps = {
    accountKey: AccountKey;
};

export const SendOutputFields = ({ accountKey }: SendOutputFieldsProps) => {
    const { control } = useFormContext();
    const outputsFieldArray = useFieldArray({ control, name: 'outputs' });

    return (
        <VStack spacing="medium">
            <Text variant="titleSmall">
                <Translation id="moduleSend.outputs.recipients.title" />
            </Text>
            <Card>
                {outputsFieldArray.fields.map((output, index) => (
                    <RecipientInputs key={output.id} index={index} accountKey={accountKey} />
                ))}
                {/* 
              TODO: add output (outputs.append({...})) button
              issue: https://github.com/trezor/trezor-suite/issues/12944 
              */}
            </Card>
        </VStack>
    );
};
