import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken, type YieldFlowFormValues } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { WrappedNativeFlowComplete } from '../common/WrappedNativeFlowComplete';
import { YieldFlowTransferRow } from '../common/YieldFlowTransferRow';
import { YieldUnwrapStep } from '../common/YieldUnwrapStep';

type UnwrapNativeTokenProps = {
    account: Account;
    tokenSymbol: string;
    tokenDecimals: number;
    tokenBalance: string;
    tokenContractAddress: string;
};

export const UnwrapNativeToken = ({
    account,
    tokenSymbol,
    tokenDecimals,
    tokenBalance,
    tokenContractAddress,
}: UnwrapNativeTokenProps) => {
    const [completedAmount, setCompletedAmount] = useState<string | null>(null);
    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: tokenBalance,
        },
    });

    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const wrappedToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        contractAddress: tokenContractAddress,
    };
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: nativeSymbol,
        decimals: tokenDecimals,
    };

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                {completedAmount !== null ? (
                    <WrappedNativeFlowComplete
                        account={account}
                        overviewRoute="wallet-index"
                        heading={<Translation id="TR_UNWRAP_COMPLETE_HEADING" />}
                        description={
                            <Translation
                                id="TR_UNWRAP_COMPLETE_DESCRIPTION"
                                values={{ tokenSymbol, nativeSymbol }}
                            />
                        }
                    >
                        <YieldFlowTransferRow
                            inputLabelId="TR_EARN_YIELD_UNWRAP_AMOUNT"
                            outputLabelId="TR_RECEIVED"
                            input={{ token: wrappedToken, amount: completedAmount }}
                            output={{ token: nativeToken, amount: completedAmount }}
                        />
                    </WrappedNativeFlowComplete>
                ) : (
                    <>
                        <Text typographyStyle="headline-md">
                            <Translation
                                id="TR_EARN_YIELD_UNWRAP_TITLE"
                                values={{ tokenSymbol, nativeSymbol }}
                            />
                        </Text>

                        <FormProvider {...methods}>
                            <YieldUnwrapStep
                                tokenSymbol={tokenSymbol}
                                tokenDecimals={tokenDecimals}
                                tokenBalance={tokenBalance}
                                onMaxClick={() => methods.setValue('amountInput', tokenBalance)}
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
