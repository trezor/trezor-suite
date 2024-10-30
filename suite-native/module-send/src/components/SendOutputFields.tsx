import { useFieldArray } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Card, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { AccountKey } from '@suite-common/wallet-types';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';

import { RecipientInputs } from './RecipientInputs';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';
import { CorrectNetworkMessageCard } from './CorrectNetworkMessageCard';

type SendOutputFieldsProps = {
    accountKey: AccountKey;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation1,
    borderWidth: utils.borders.widths.small,
}));

export const SendOutputFields = ({ accountKey }: SendOutputFieldsProps) => {
    const { applyStyle } = useNativeStyles();
    const { control } = useFormContext<SendOutputsFormValues>();
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const outputsFieldArray = useFieldArray({ control, name: 'outputs' });

    return (
        <VStack spacing="sp16">
            <Text variant="titleSmall">
                <Translation id="moduleSend.outputs.recipients.title" />
            </Text>
            {networkSymbol && <CorrectNetworkMessageCard networkSymbol={networkSymbol} />}
            <Card style={applyStyle(cardStyle)}>
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
