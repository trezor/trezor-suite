import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectGetNamedAddressSupportDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import type { DeviceRootState } from '@suite-common/device';
import { selectAccounts, selectSendFormReviewLastButtonCode } from '@suite-common/wallet-core';
import type {
    FormState,
    GeneralPrecomposedTransactionFinal,
    ReviewOutput,
    StakeFormState,
    StakeType,
} from '@suite-common/wallet-types';
import {
    findAccountsByAddress,
    getEvmTransactionPurpose,
    isEvmApprovalTx,
    isEvmYieldTxByTextSignature,
} from '@suite-common/wallet-utils';
import { Column, H4 } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';

import { TransactionReviewOutput } from './TransactionReviewOutput';
import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';
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
    scroll-margin-top: 48px;
`;

const SectionHeading = ({ output, index }: { output: ReviewOutput; index: number }) => (
    <H4 margin={{ top: index === 0 ? 0 : 8 }}>
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
    const accounts = useSelector(selectAccounts);
    const { getNamedAddressSupport } = useServices(selectGetNamedAddressSupportDep);
    const { networkType, symbol } = account;
    const namedAddress = getNamedAddressSupport(symbol);
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

    // Resolved from the full context, not the calldata alone, so a WETH deposit()/withdraw() is
    // classified as wrap/unwrap — the review rows for those mirror the device's clear-signing
    // screens and need to know which of the two it is.
    const evmTxType = getEvmTransactionPurpose({
        networkSymbol: symbol,
        to: precomposedTx.outputs.find(o => 'address' in o && typeof o.address === 'string')
            ?.address,
        data: precomposedForm.transactionData,
    });

    const isYieldOperation = isEvmYieldTxByTextSignature(evmTxType) || evmTxType === 'claim';

    const isInternalTransfer =
        isFirstOutputAddress &&
        typeof outputs[0]?.value === 'string' &&
        findAccountsByAddress(symbol, outputs[0]?.value, accounts).length > 0;

    const summaryIndex = outputs.findIndex(
        ({ type }) => !['address', 'amount', 'opreturn'].includes(type),
    );

    const isTronStakeFreeze =
        networkType === 'tron' &&
        (precomposedForm.tronStaking?.kind === 'freeze' ||
            precomposedForm.tronStaking?.kind === 'unstake');

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
        !isYieldOperation &&
        !signedTx
    ) {
        // If the user typed an ENS name, the form keeps the original input on `address`
        // and the resolved hex on `resolvedAddress`. Surface both so the user can cross-
        // check what they entered against what the device shows.
        const firstFormOutput =
            'outputs' in precomposedForm ? precomposedForm.outputs?.[0] : undefined;
        const isEnsResolved =
            !!firstFormOutput &&
            !!firstFormOutput.address &&
            !!firstFormOutput.resolvedAddress &&
            firstFormOutput.address !== firstFormOutput.resolvedAddress &&
            namedAddress.isNameLike(firstFormOutput.address);
        const ensName = isEnsResolved ? firstFormOutput.address : undefined;
        const ensResolvedAddress = isEnsResolved ? firstFormOutput.resolvedAddress : undefined;

        return (
            <TransactionReviewVerifyAddress
                networkType={networkType}
                deadline={deadline}
                onTryAgain={onTryAgain}
                isSending={isSending}
                ensName={ensName}
                resolvedAddress={ensResolvedAddress}
            />
        );
    }

    return (
        <Column gap={16}>
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
                        <Column gap={12}>
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
                                evmTxType={evmTxType}
                                nativeToken={nativeToken}
                                isTronStakeFreeze={isTronStakeFreeze}
                            />
                        </Column>
                    </Wrapper>
                );
            })}

            {!(isRbfAction && networkType === 'bitcoin') &&
                (networkType !== 'tron' || isTronStakeFreeze) && (
                    <Wrapper ref={totalOutputRef}>
                        <Column gap={12}>
                            {isMultirecipient && summaryIndex === -1 && (
                                <H4 margin={{ top: 8 }}>
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
        </Column>
    );
};
