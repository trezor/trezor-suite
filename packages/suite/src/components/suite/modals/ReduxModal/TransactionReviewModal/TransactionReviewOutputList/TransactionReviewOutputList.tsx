import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import type { GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { ReviewOutput, StakeType } from '@suite-common/wallet-types';
import { findAccountsByAddress } from '@suite-common/wallet-utils';
import { Banner, BulletList, Card, Column, H3, H4, Text } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';

import { TransactionReviewOutput } from './TransactionReviewOutput';
import type { TransactionReviewOutputElementProps } from './TransactionReviewOutputElement';
import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';

export type TransactionReviewOutputListProps = {
    account: Account;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    signedTx?: { tx: string };
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
        return 'confirmed';
    }

    if (index === buttonRequestsCount - 1) {
        return 'active';
    }

    return 'unconfirmed';
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
    const outputRefs = useRef<(HTMLDivElement | null)[]>([]);
    const totalOutputRef = useRef<HTMLDivElement | null>(null);
    const accounts = useSelector(state => state.wallet.accounts);
    const { networkType, symbol } = account;
    const isMultirecipient = outputs.filter(({ type }) => type === 'address').length > 1;
    const isFirstOutputAddress = outputs[0].type === 'address';
    const isFirstStep = buttonRequestsCount === 1;
    const isNotStaking = !stakeType;
    const isInternalTransfer =
        isFirstOutputAddress &&
        findAccountsByAddress(symbol, outputs[0].value, accounts).length > 0;

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

    if (isFirstOutputAddress && isFirstStep && isNotStaking && !isInternalTransfer) {
        return (
            <Card>
                <Column gap={spacings.xxxl}>
                    <H3>
                        <Translation id="TR_SEND_ADDRESS_CONFIRMATION_HEADING" />
                    </H3>
                    <BulletList
                        isOrdered
                        bulletGap={spacings.md}
                        titleGap={spacings.zero}
                        gap={spacings.xxl}
                    >
                        <BulletList.Item
                            title={
                                <H4 typographyStyle="hint">
                                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_ITEM_1_HEADING" />
                                </H4>
                            }
                        />
                        <BulletList.Item
                            title={
                                <H4 typographyStyle="hint">
                                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_ITEM_2_HEADING" />
                                </H4>
                            }
                        />
                        <BulletList.Item
                            state="done"
                            title={
                                <H4 typographyStyle="hint">
                                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_ITEM_3_HEADING" />
                                </H4>
                            }
                        />
                    </BulletList>
                </Column>
            </Card>
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
