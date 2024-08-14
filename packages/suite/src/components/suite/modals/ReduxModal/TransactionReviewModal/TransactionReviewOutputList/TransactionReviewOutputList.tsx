import { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { Button, variables, Warning } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import { TranslationKey } from '@suite-common/intl-types';
import { copyToClipboard, download } from '@trezor/dom-utils';
import { useDispatch } from 'src/hooks/suite';
import { TransactionReviewDetails } from './TransactionReviewDetails';
import { TransactionReviewOutput } from './TransactionReviewOutput';
import type { Account } from 'src/types/wallet';
import type { FormState, GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getTransactionReviewOutputState } from '@suite-common/wallet-utils';
import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';
import { ReviewOutput } from '@suite-common/wallet-types';
import { spacingsPx } from '@trezor/theme';
import { StakeFormState, StakeType } from '@suite-common/wallet-types';

const Content = styled.div`
    display: flex;
    padding: 0;
    flex: 1;
`;
const Flex = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
`;

const Right = styled.div`
    flex: 1;
    margin: 20px 10px 10px 25px;
    max-width: 460px;
    position: relative;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 20px 10px 10px;
    }
`;

const RightTop = styled.div`
    flex: 1;
    height: 320px;
    overflow-y: auto;
`;

const RightTopInner = styled.div`
    padding: 10px 0 20px;
`;

const RightBottom = styled.div`
    margin-left: 30px;
    padding: 20px 0 0;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    display: flex;
    flex-direction: column;

    ${variables.SCREEN_QUERY.MOBILE} {
        display: block;
        margin-left: 0;
    }
`;

const StyledButton = styled(Button)`
    display: flex;
    flex: 1;

    ${variables.SCREEN_QUERY.MOBILE} {
        width: 100%;

        & + & {
            margin: 10px 0 0;
        }
    }
`;

const TxReviewFootnote = styled.div`
    margin-top: ${spacingsPx.md};
`;

const Nowrap = styled.span`
    white-space: nowrap;
`;

export interface TransactionReviewOutputListProps {
    account: Account;
    precomposedForm: FormState | StakeFormState;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    signedTx?: { tx: string }; // send reducer
    decision?: { resolve: (success: boolean) => void }; // dfd
    detailsOpen: boolean;
    outputs: ReviewOutput[];
    buttonRequestsCount: number;
    isRbfAction: boolean;
    actionText: TranslationKey;
    isSending?: boolean;
    setIsSending?: () => void;
    ethereumStakeType?: StakeType;
}

export const TransactionReviewOutputList = ({
    account,
    precomposedForm,
    precomposedTx,
    signedTx,
    decision,
    detailsOpen,
    outputs,
    buttonRequestsCount,
    isRbfAction,
    actionText,
    isSending,
    setIsSending,
    ethereumStakeType,
}: TransactionReviewOutputListProps) => {
    const dispatch = useDispatch();
    const { networkType } = account;

    const { symbol } = account;
    const { options, selectedFee } = precomposedForm;
    let isCoinControlEnabled = false;
    let hasCoinControlBeenOpened = false;
    if ('isCoinControlEnabled' in precomposedForm) {
        ({ isCoinControlEnabled } = precomposedForm);
    }
    if ('hasCoinControlBeenOpened' in precomposedForm) {
        ({ hasCoinControlBeenOpened } = precomposedForm);
    }
    const broadcastEnabled = options.includes('broadcast');

    const reportTransactionCreatedEvent = (action: 'sent' | 'copied' | 'downloaded' | 'replaced') =>
        analytics.report({
            type: EventType.TransactionCreated,
            payload: {
                action,
                symbol,
                tokens: outputs
                    .filter(output => output.token?.symbol)
                    .map(output => output.token?.symbol)
                    .join(','),
                outputsCount: precomposedForm.outputs.length,
                broadcast: broadcastEnabled,
                bitcoinLockTime: !!options.includes('bitcoinLockTime'),
                ethereumData: !!options.includes('ethereumData'),
                rippleDestinationTag: !!options.includes('rippleDestinationTag'),
                ethereumNonce: !!options.includes('ethereumNonce'),
                selectedFee: selectedFee || 'normal',
                isCoinControlEnabled,
                hasCoinControlBeenOpened,
            },
        });
    const handleSend = () => {
        if (networkType === 'solana') {
            setIsSending?.();
        }
        if (decision) {
            decision.resolve(true);

            reportTransactionCreatedEvent(isRbfAction ? 'replaced' : 'sent');
        }
    };
    const handleCopy = () => {
        const result = copyToClipboard(signedTx!.tx);
        if (typeof result !== 'string') {
            dispatch(
                notificationsActions.addToast({
                    type: 'copy-to-clipboard',
                }),
            );
        }

        reportTransactionCreatedEvent('copied');
    };
    const handleDownload = () => {
        download(signedTx!.tx, 'signed-transaction.txt');

        reportTransactionCreatedEvent('downloaded');
    };

    const outputRefs = useRef<(HTMLDivElement | null)[]>([]);

    const totalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isLastStep =
            getTransactionReviewOutputState(outputs.length, buttonRequestsCount) === 'active';

        if (isLastStep) {
            totalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            const activeIndex = outputs.findIndex(
                (_, index) =>
                    getTransactionReviewOutputState(index, buttonRequestsCount) === 'active',
            );

            outputRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [buttonRequestsCount, outputs]);

    return (
        <Content>
            <Right>
                {detailsOpen && (
                    <TransactionReviewDetails tx={precomposedTx} txHash={signedTx?.tx} />
                )}
                <RightTop>
                    <RightTopInner>
                        {outputs.map((output, index) => {
                            const state = signedTx
                                ? 'success'
                                : getTransactionReviewOutputState(index, buttonRequestsCount);

                            return (
                                <TransactionReviewOutput
                                    // it's safe to use array index since outputs do not change

                                    key={index}
                                    ref={el => (outputRefs.current[index] = el)}
                                    {...output}
                                    state={state}
                                    symbol={symbol}
                                    account={account}
                                    isRbf={isRbfAction}
                                    ethereumStakeType={ethereumStakeType}
                                />
                            );
                        })}
                        {!(isRbfAction && networkType === 'bitcoin') && (
                            <TransactionReviewTotalOutput
                                ref={totalRef}
                                account={account}
                                signedTx={signedTx}
                                outputs={outputs}
                                buttonRequestsCount={buttonRequestsCount}
                                precomposedTx={precomposedTx}
                            />
                        )}
                    </RightTopInner>
                </RightTop>
                <RightBottom>
                    {broadcastEnabled ? (
                        <StyledButton
                            data-testid="@modal/send"
                            isDisabled={!signedTx}
                            isLoading={isSending}
                            onClick={handleSend}
                        >
                            <Translation id={actionText} />
                        </StyledButton>
                    ) : (
                        <Flex>
                            <StyledButton
                                isDisabled={!signedTx}
                                onClick={handleCopy}
                                data-testid="@send/copy-raw-transaction"
                            >
                                <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
                            </StyledButton>
                            <StyledButton
                                variant="tertiary"
                                isDisabled={!signedTx}
                                onClick={handleDownload}
                            >
                                <Translation id="DOWNLOAD_TRANSACTION" />
                            </StyledButton>
                        </Flex>
                    )}
                    {isSending && networkType === 'solana' ? (
                        <TxReviewFootnote>
                            <Warning variant="tertiary" icon="INFO">
                                <Translation
                                    id="TR_SOLANA_TX_CONFIRMATION_MAY_TAKE_UP_TO_1_MIN"
                                    values={{ nowrap: chunks => <Nowrap>{chunks}</Nowrap> }}
                                />
                            </Warning>
                        </TxReviewFootnote>
                    ) : null}
                </RightBottom>
            </Right>
        </Content>
    );
};
