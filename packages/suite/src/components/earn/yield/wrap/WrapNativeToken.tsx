import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken, type YieldFlowFormValues } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { WrappedNativeFlowComplete } from '../common/WrappedNativeFlowComplete';
import { YieldFlowTransferRow } from '../common/YieldFlowTransferRow';
import { YieldWrapStep } from '../common/YieldWrapStep';

type WrapNativeTokenProps = {
    account: Account;
    token: YieldFlowDisplayToken & { contractAddress: string };
};

export const WrapNativeToken = ({ account, token }: WrapNativeTokenProps) => {
    const [completedAmount, setCompletedAmount] = useState<string | null>(null);
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: '',
        },
    });

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: nativeSymbol,
        decimals: token.decimals,
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {completedAmount !== null ? (
                    <WrappedNativeFlowComplete
                        account={account}
                        heading={<Translation id="TR_WRAP_COMPLETE_HEADING" />}
                        description={
                            <Translation
                                id="TR_WRAP_COMPLETE_DESCRIPTION"
                                values={{ nativeSymbol, tokenSymbol: token.symbol }}
                            />
                        }
                    >
                        <YieldFlowTransferRow
                            inputLabelId="TR_EARN_YIELD_WRAP_AMOUNT"
                            outputLabelId="TR_RECEIVED"
                            input={{ token: nativeToken, amount: completedAmount }}
                            output={{ token, amount: completedAmount }}
                        />
                    </WrappedNativeFlowComplete>
                ) : (
                    <>
                        <Text typographyStyle="headline-md">
                            <Translation
                                id="TR_EARN_YIELD_WRAP_TITLE"
                                values={{ nativeSymbol, tokenSymbol: token.symbol }}
                            />
                        </Text>

                        <FormProvider {...methods}>
                            <YieldWrapStep
                                token={token}
                                nativeSymbol={nativeSymbol}
                                nativeBalance={account.formattedBalance}
                                shouldShowReceivingRow={false}
                                onMaxClick={() =>
                                    methods.setValue('amountInput', account.formattedBalance)
                                }
                                onSubmit={() =>
                                    setCompletedAmount(methods.getValues('amountInput') || '0')
                                }
                            />
                        </FormProvider>
                    </>
                )}
            </Column>
        </Column>
    );
};
