import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { Banner, Column, H4, Text } from '@trezor/components';
import type { GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { ReviewOutput, StakeType } from '@suite-common/wallet-types';
import { spacings, spacingsPx } from '@trezor/theme';

import type { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';

import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';
import { TransactionReviewOutput } from './TransactionReviewOutput';
import type { TransactionReviewOutputElementProps } from './TransactionReviewOutputElement';

export type TransactionReviewOutputListProps = {
    account: Account;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    signedTx?: { tx: string }; // send reducer
    outputs: ReviewOutput[];
    buttonRequestsCount: number;
    isRbfAction: boolean;
    isSending?: boolean;
    stakeType?: StakeType;
};

const getState = (
    index: number,
    buttonRequestsCount: number,
    hasSignedTx: boolean,
): TransactionReviewOutputElementProps['state'] => {
    if (hasSignedTx || index < buttonRequestsCount - 1) {
        return 'done';
    }

    if (index === buttonRequestsCount - 1) {
        return 'default';
    }

    return 'pending';
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
    signedTx,
    outputs,
    buttonRequestsCount,
    isRbfAction,
    isSending,
    stakeType,
}: TransactionReviewOutputListProps) => {
    const { networkType } = account;
    const isMultirecipient = outputs.filter(({ type }) => type === 'address').length > 1;

    const summaryIndex = outputs.findIndex(
        ({ type }) => !['address', 'amount', 'opreturn'].includes(type),
    );

    useEffect(() => {
        if (buttonRequestsCount - 1 === outputs.length || signedTx) {
            // When the tx is signed, the outputs are updated, so we use instant scroll to prevent jumping
            totalOutputRef.current?.scrollIntoView({ behavior: signedTx ? 'instant' : 'smooth' });
        } else if (buttonRequestsCount !== 0) {
            outputRefs.current[buttonRequestsCount - 1]?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [buttonRequestsCount, outputs.length, signedTx]);

    return (
        <Column gap={spacings.md}>
            {outputs.map((output, index) => {
                const isHeadingShown =
                    isMultirecipient && (output.type === 'address' || index === summaryIndex);
                const recipientIndex = outputs
                    .filter(({ type }) => type === 'address')
                    .indexOf(output);

                return (
                    <Wrapper key={index} ref={ref => (outputRefs.current[index] = ref)}>
                        <Column gap={spacings.sm}>
                            {isHeadingShown && (
                                <SectionHeading output={output} index={recipientIndex} />
                            )}
                            <TransactionReviewOutput
                                {...output}
                                state={getState(index, buttonRequestsCount, !!signedTx)}
                                account={account}
                                isRbf={isRbfAction}
                                stakeType={stakeType}
                            />
                        </Column>
                    </Wrapper>
                );
            })}
            {!(isRbfAction && networkType === 'bitcoin') && (
                <Wrapper ref={totalOutputRef}>
                    <Column gap={spacings.sm}>
                        {isMultirecipient && summaryIndex === -1 && (
                            <H4 margin={{ top: spacings.xs }}>
                                <Translation id="TR_SUMMARY" />
                            </H4>
                        )}
                        <TransactionReviewTotalOutput
                            account={account}
                            state={getState(outputs.length, buttonRequestsCount, !!signedTx)}
                            precomposedTx={precomposedTx}
                            stakeType={stakeType}
                            isRbf={isRbfAction}
                        />
                    </Column>
                </Wrapper>
            )}
            {isSending && networkType === 'solana' ? (
                <Banner variant="tertiary" icon="info">
                    <Translation
                        id="TR_SOLANA_TX_CONFIRMATION_MAY_TAKE_UP_TO_1_MIN"
                        values={{ nowrap: chunks => <Text textWrap="nowrap">{chunks}</Text> }}
                    />
                </Banner>
            ) : null}
        </Column>
    );
};
