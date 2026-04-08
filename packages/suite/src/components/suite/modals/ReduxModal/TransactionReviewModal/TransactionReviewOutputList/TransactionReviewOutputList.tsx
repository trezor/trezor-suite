import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import type { DeviceRootState } from '@suite-common/device';
import { selectSendFormReviewLastButtonCode } from '@suite-common/wallet-core';
import type {
    FormState,
    GeneralPrecomposedTransactionFinal,
    ReviewOutput,
    StakeFormState,
    StakeType,
} from '@suite-common/wallet-types';
import {
    findAccountsByAddress,
    getEvmTransactionTextSignature,
    isEvmApprovalTx,
} from '@suite-common/wallet-utils';
import { Column, H4 } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';

import { TransactionReviewOutput } from './TransactionReviewOutput';
import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';
import { TransactionReviewTronFeeLimitOutput } from './TransactionReviewTronFeeLimitOutput';
import { TransactionReviewVerifyAddress } from './TransactionReviewVerifyAddress';
import { getTransactionReviewState } from './getTransactionReviewState';

export type TransactionReviewOutputListProps = {
    account: Account;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    precomposedForm: FormState | StakeFormState;
    signedTx?: { tx: string };
    outputs: ReviewOutput[];
    buttonRequestsCount: number;
    isRbfAction: boolean;
    reviewStep: number;
    onTryAgain: (close: boolean) => void;
    isSending?: boolean;
    stakeType?: StakeType;
    deadline?: number;
};

const Wrapper = styled.div`
    scroll-margin-top: ${spacingsPx.xxxxl};
`;

const SectionHeading = ({ output, index }: { output: ReviewOutput; index: number }) => (
    <H4 margin={{ top: index === 0 ? spacings.zero : spacings.xs }}>
        {output.type === 'address' ? (
            <Translation
                id="TR_SEND_RECIPIENT_ADDRESS"
                values={{
                    index: index + 1,
                }}
            />
        ) : (
            <Translation id="TR_SUMMARY" />
        )}
    </H4>
);

export const TransactionReviewOutputList = ({
    account,
    precomposedTx,
    precomposedForm,
    signedTx,
    outputs,
    buttonRequestsCount,
    isRbfAction,
    stakeType,
    deadline,
    reviewStep,
    onTryAgain,
    isSending,
}: TransactionReviewOutputListProps) => {
    const outputRefs = useRef<(HTMLDivElement | null)[]>([]);
    const totalOutputRef = useRef<HTMLDivElement | null>(null);
    const accounts = useSelector(state => state.wallet.accounts);
    const { networkType, symbol } = account;
    const isMultirecipient = outputs.filter(({ type }) => type === 'address').length > 1;
    const isFirstOutputAddress = outputs[0]?.type === 'address';

    const lastButtonRequestCode = useSelector((state: DeviceRootState) =>
        selectSendFormReviewLastButtonCode(state, symbol),
    );

    const reviewState = getTransactionReviewState({
        index: outputs.length,
        currentStep: reviewStep,
        hasSignedTx: !!signedTx,
        lastButtonRequestCode,
    });

    const { trading: isTrading } = precomposedForm;

    const isFirstStep = buttonRequestsCount <= 1;

    const isStaking = stakeType;

    const isApprovalTx = isEvmApprovalTx(precomposedForm.transactionData);

    const isInternalTransfer =
        isFirstOutputAddress &&
        typeof outputs[0]?.value === 'string' &&
        findAccountsByAddress(symbol, outputs[0]?.value, accounts).length > 0;

    const summaryIndex = outputs.findIndex(
        ({ type }) => !['address', 'amount', 'opreturn'].includes(type),
    );

    const nativeToken =
        account.accountType === 'placeholder' && 'nativeToken' in precomposedTx
            ? precomposedTx.nativeToken
            : undefined;

    useEffect(() => {
        if (reviewStep === outputs.length || signedTx) {
            // When the tx is signed, the outputs are updated, so we use instant scroll to prevent jumping
            totalOutputRef.current?.scrollIntoView({ behavior: signedTx ? 'instant' : 'smooth' });
        } else if (reviewStep !== 0) {
            outputRefs.current[reviewStep]?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [reviewStep, outputs.length, signedTx]);

    if (
        isFirstOutputAddress &&
        isFirstStep &&
        !isStaking &&
        !isApprovalTx &&
        !isTrading &&
        !isInternalTransfer &&
        !signedTx
    ) {
        return (
            <TransactionReviewVerifyAddress
                networkType={networkType}
                deadline={deadline}
                onTryAgain={onTryAgain}
                isSending={isSending}
            />
        );
    }

    return (
        <Column gap={spacings.md}>
            {outputs.map((output, index) => {
                const isHeadingShown =
                    isMultirecipient && (output.type === 'address' || index === summaryIndex);
                const recipientIndex = outputs
                    .filter(({ type }) => type === 'address')
                    .indexOf(output);

                return (
                    <Wrapper
                        key={index}
                        ref={(ref: HTMLDivElement | null) => {
                            outputRefs.current[index] = ref;
                        }}
                    >
                        <Column gap={spacings.sm}>
                            {isHeadingShown && (
                                <SectionHeading output={output} index={recipientIndex} />
                            )}

                            <TransactionReviewOutput
                                {...output}
                                state={getTransactionReviewState({
                                    index,
                                    currentStep: reviewStep,
                                    hasSignedTx: !!signedTx,
                                })}
                                account={account}
                                isRbf={isRbfAction}
                                isTrading={!!isTrading}
                                stakeType={stakeType}
                                evmTxType={getEvmTransactionTextSignature(
                                    precomposedForm.transactionData,
                                )}
                                nativeToken={nativeToken}
                            />
                        </Column>
                    </Wrapper>
                );
            })}

            {!(isRbfAction && networkType === 'bitcoin') && networkType !== 'tron' && (
                <Wrapper ref={totalOutputRef}>
                    <Column gap={spacings.sm}>
                        {isMultirecipient && summaryIndex === -1 && (
                            <H4 margin={{ top: spacings.xs }}>
                                <Translation id="TR_SUMMARY" />
                            </H4>
                        )}
                        <TransactionReviewTotalOutput
                            account={account}
                            state={reviewState}
                            precomposedTx={precomposedTx}
                            precomposedForm={precomposedForm}
                            stakeType={stakeType}
                            isRbf={isRbfAction}
                        />
                    </Column>
                </Wrapper>
            )}

            {networkType === 'tron' && 'token' in precomposedTx && precomposedTx.token && (
                <Wrapper ref={totalOutputRef}>
                    <TransactionReviewTronFeeLimitOutput
                        account={account}
                        state={reviewState}
                        precomposedForm={precomposedForm}
                        precomposedTx={precomposedTx}
                    />
                </Wrapper>
            )}
        </Column>
    );
};
