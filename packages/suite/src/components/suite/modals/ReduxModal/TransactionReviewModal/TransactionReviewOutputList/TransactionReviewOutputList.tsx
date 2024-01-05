import { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { Button, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import { copyToClipboard, download } from '@trezor/dom-utils';
import { useDispatch } from 'src/hooks/suite';
import { TransactionReviewDetails } from './TransactionReviewDetails';
import { TransactionReviewOutput } from './TransactionReviewOutput';
import type { Account } from 'src/types/wallet';
import type {
    FormState,
    PrecomposedTransactionFinal,
    TxFinalCardano,
} from 'src/types/wallet/sendForm';
import { getOutputState } from 'src/utils/wallet/reviewTransactionUtils';
import { TransactionReviewTotalOutput } from './TransactionReviewTotalOutput';
import { ReviewOutput } from 'src/types/wallet/transaction';

const Content = styled.div`
    display: flex;
    padding: 0;
    flex: 1;
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

export interface TransactionReviewOutputListProps {
    account: Account;
    precomposedForm: FormState;
    precomposedTx: PrecomposedTransactionFinal | TxFinalCardano;
    signedTx?: { tx: string }; // send reducer
    decision?: { resolve: (success: boolean) => void }; // dfd
    detailsOpen: boolean;
    outputs: ReviewOutput[];
    buttonRequestsCount: number;
    isRbfAction: boolean;
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
}: TransactionReviewOutputListProps) => {
    const dispatch = useDispatch();
    const { networkType } = account;

    const { symbol } = account;
    const { options, selectedFee, isCoinControlEnabled, hasCoinControlBeenOpened } =
        precomposedForm;
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
                bitcoinRbf: !!options.includes('bitcoinRBF'),
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
        const isLastStep = getOutputState(outputs.length, buttonRequestsCount) === 'active';

        if (isLastStep) {
            totalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            const activeIndex = outputs.findIndex(
                (_, index) => getOutputState(index, buttonRequestsCount) === 'active',
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
                                : getOutputState(index, buttonRequestsCount);

                            return (
                                <TransactionReviewOutput
                                    // it's safe to use array index since outputs do not change
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={index}
                                    ref={el => (outputRefs.current[index] = el)}
                                    {...output}
                                    state={state}
                                    symbol={symbol}
                                    account={account}
                                    isRbf={isRbfAction}
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
                            data-test="@modal/send"
                            isDisabled={!signedTx}
                            onClick={handleSend}
                        >
                            <Translation id={isRbfAction ? 'TR_REPLACE_TX' : 'SEND_TRANSACTION'} />
                        </StyledButton>
                    ) : (
                        <>
                            <StyledButton
                                isDisabled={!signedTx}
                                onClick={handleCopy}
                                data-test="@send/copy-raw-transaction"
                            >
                                <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
                            </StyledButton>
                            <StyledButton
                                variant="secondary"
                                isDisabled={!signedTx}
                                onClick={handleDownload}
                            >
                                <Translation id="DOWNLOAD_TRANSACTION" />
                            </StyledButton>
                        </>
                    )}
                </RightBottom>
            </Right>
        </Content>
    );
};
