import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { Button, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { notificationsActions } from '@suite-common/toast-notifications';
import { copyToClipboard, download } from '@trezor/dom-utils';
import { useActions } from '@suite-hooks';
import { TransactionDetails } from './TransactionDetails';
import Output, { OutputProps } from './Output';
import type { Account } from '@wallet-types';
import type {
    FormState,
    PrecomposedTransactionFinal,
    TxFinalCardano,
} from '@wallet-types/sendForm';
import { getOutputState } from './getOutputState';
import { TotalOutput } from './TotalOutput';

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
        margin: 20px 10px 10px 10px;
    }
`;

const RightTop = styled.div`
    flex: 1;
    height: 320px;
    overflow-y: auto;
`;

const RightTopInner = styled.div`
    padding: 10px 0 20px 0;
`;

const RightBottom = styled.div`
    margin-left: 30px;
    padding: 20px 0 0 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    display: flex;

    ${variables.SCREEN_QUERY.MOBILE} {
        display: block;
        margin-left: 0px;
    }
`;

const StyledButton = styled(Button)`
    display: flex;
    flex: 1;
    margin: 0 10px 0 0;

    ${variables.SCREEN_QUERY.MOBILE} {
        width: 100%;

        & + & {
            margin: 10px 0 0 0;
        }
    }
`;

export interface OutputListProps {
    account: Account;
    precomposedForm: FormState;
    precomposedTx: PrecomposedTransactionFinal | TxFinalCardano;
    signedTx?: { tx: string }; // send reducer
    decision?: { resolve: (success: boolean) => void }; // dfd
    detailsOpen: boolean;
    outputs: OutputProps[];
    buttonRequestsCount: number;
    isRbfAction: boolean;
}

const OutputList = ({
    account,
    precomposedForm,
    precomposedTx,
    signedTx,
    decision,
    detailsOpen,
    outputs,
    buttonRequestsCount,
    isRbfAction,
}: OutputListProps) => {
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

    const htmlElement = useRef<HTMLDivElement>(null);
    const totalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isLastStep = getOutputState(outputs.length, buttonRequestsCount) === 'active';

        if (isLastStep) {
            totalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [buttonRequestsCount, outputs.length, totalRef]);

    const { addNotification } = useActions({
        addNotification: notificationsActions.addToast,
    });

    return (
        <Content>
            <Right>
                {detailsOpen && <TransactionDetails tx={precomposedTx} txHash={signedTx?.tx} />}
                <RightTop>
                    <RightTopInner>
                        {outputs.map((output, index) => {
                            const state = signedTx
                                ? 'success'
                                : getOutputState(index, buttonRequestsCount);

                            return (
                                <Output
                                    // it's safe to use array index since outputs do not change
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={index}
                                    {...output}
                                    state={state}
                                    symbol={symbol}
                                    account={account}
                                />
                            );
                        })}

                        {!precomposedTx.token && (
                            <TotalOutput
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
                <RightBottom ref={htmlElement}>
                    {broadcastEnabled ? (
                        <StyledButton
                            data-test="@modal/send"
                            isDisabled={!signedTx}
                            onClick={() => {
                                if (decision) {
                                    decision.resolve(true);

                                    reportTransactionCreatedEvent(
                                        isRbfAction ? 'replaced' : 'sent',
                                    );
                                }
                            }}
                        >
                            <Translation id={isRbfAction ? 'TR_REPLACE_TX' : 'SEND_TRANSACTION'} />
                        </StyledButton>
                    ) : (
                        <>
                            <StyledButton
                                isDisabled={!signedTx}
                                onClick={() => {
                                    const result = copyToClipboard(
                                        signedTx!.tx,
                                        htmlElement.current,
                                    );
                                    if (typeof result !== 'string') {
                                        addNotification({ type: 'copy-to-clipboard' });
                                    }

                                    reportTransactionCreatedEvent('copied');
                                }}
                                data-test="@send/copy-raw-transaction"
                            >
                                <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
                            </StyledButton>
                            <StyledButton
                                variant="secondary"
                                isDisabled={!signedTx}
                                onClick={() => {
                                    download(signedTx!.tx, 'signed-transaction.txt');

                                    reportTransactionCreatedEvent('downloaded');
                                }}
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

export default OutputList;
