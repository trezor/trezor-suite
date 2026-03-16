import { useFieldArray } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Card, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { NetworkReserveBanner } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { RecipientInputs } from './RecipientInputs';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { CorrectNetworkMessageCard } from './CorrectNetworkMessageCard';

type SendOutputFieldsProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
}));

export const SendOutputFields = ({ accountKey, tokenContract }: SendOutputFieldsProps) => {
    const { applyStyle } = useNativeStyles();
    const { control } = useFormContext<SendOutputsFormValues>();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const outputsFieldArray = useFieldArray({ control, name: 'outputs' });

    return (
        <VStack spacing="sp16">
            <Text variant="headline-sm">
                <Translation id="moduleSend.outputs.recipients.title" />
            </Text>
            {symbol && <CorrectNetworkMessageCard symbol={symbol} />}
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing="sp12">
                    {outputsFieldArray.fields.map((output, index) => (
                        <RecipientInputs key={output.id} index={index} accountKey={accountKey} />
                    ))}
                    {/*
                    TODO: add output (outputs.append({...})) button
                    issue: https://github.com/trezor/trezor-suite/issues/12944
                    */}
                    {symbol && (
                        <NetworkReserveBanner symbol={symbol} contractAddress={tokenContract} />
                    )}
                </VStack>
            </Card>
        </VStack>
    );
};
