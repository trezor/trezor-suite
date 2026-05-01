import { useFieldArray } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountFormattedBalance,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Card, Text, VStack } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    NetworkReserveBanner,
    useIsNetworkReserveBannerVisible,
} from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CorrectNetworkMessageCard } from './CorrectNetworkMessageCard';
import { RecipientInputs } from './RecipientInputs';
import { SolanaMemoInput } from './SolanaMemoInput';
import { TronAccountActivationInfo } from './TronAccountActivationInfo';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { TronNoteInput } from './TronNoteInput';

type SendOutputFieldsProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    maxAmount?: string;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
}));

export const SendOutputFields = ({
    accountKey,
    tokenContract,
    maxAmount,
}: SendOutputFieldsProps) => {
    const { applyStyle } = useNativeStyles();
    const { control, watch } = useFormContext<SendOutputsFormValues>();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const formattedBalance = useSelector((state: AccountsRootState) =>
        selectAccountFormattedBalance(state, accountKey),
    );
    const outputsFieldArray = useFieldArray({ control, name: 'outputs' });

    const amount = watch('outputs.0.amount');

    const shouldShowBanner = useIsNetworkReserveBannerVisible({
        symbol,
        contractAddress: tokenContract,
        amount,
        balance: formattedBalance,
        maxAmount,
    });

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
                    {symbol && shouldShowBanner && (
                        <NetworkReserveBanner symbol={symbol} contractAddress={tokenContract} />
                    )}
                    <TronAccountActivationInfo accountKey={accountKey} />
                </VStack>
            </Card>

            {symbol && getNetworkType(symbol) === 'tron' && <TronNoteInput symbol={symbol} />}
            {symbol && getNetworkType(symbol) === 'solana' && <SolanaMemoInput />}
        </VStack>
    );
};
