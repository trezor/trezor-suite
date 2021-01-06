import React, { createRef } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { formatNetworkAmount, isTestnet } from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import { copyToClipboard, download } from '@suite-utils/dom';
import { useActions } from '@suite-hooks';
import Output, { OutputProps } from './Output';
import OutputElement from './OutputElement';
import Detail from './Detail';
import { Props as IndicatorProps } from './Indicator';
import { Account } from '@wallet-types';
import { FormState, PrecomposedTransactionFinal } from '@wallet-types/sendForm';

const Content = styled.div`
    display: flex;
    padding: 0;
    flex: 1;
`;

const Right = styled.div`
    flex: 1;
    margin: 20px 10px 10px 35px;
    max-width: 460px;
    position: relative;
`;

const RightTop = styled.div`
    flex: 1;
    height: 320px;
    overflow-y: auto;
`;

const RightTopInner = styled.div`
    padding: 10px 0 20px 0;
`;

const RightBottom = styled.div<{ margin: boolean; fadeOutGradient: boolean }>`
    ${props => props.margin && 'margin-left: 50px'};
    padding: 20px 0 0 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    ${props =>
        props.fadeOutGradient &&
        `&:after {
            position: absolute;
            content: '';
            width: calc(100% + 60px);
            left: -60px;
            top: -21px;
            height: 20px;
            background: linear-gradient(transparent, ${props.theme.BG_WHITE});
            z-index: 1;
        }`}
`;

const StyledButton = styled(Button)`
    display: flex;
    flex: 1;
    & + & {
        margin-top: 20px;
    }
`;

interface Props {
    activeStep: number;
    account: Account;
    precomposedForm: FormState;
    precomposedTx: PrecomposedTransactionFinal;
    signedTx?: { tx: string }; // send reducer
    decision?: { resolve: (success: boolean) => any }; // dfd
    detailsOpen: boolean;
    outputs: OutputProps[];
    buttonRequests: string[];
    isRbfAction?: boolean;
    toggleDetails: () => void;
}

const OutputList = ({
    activeStep,
    account,
    precomposedForm,
    precomposedTx,
    signedTx,
    decision,
    detailsOpen,
    outputs,
    buttonRequests,
    isRbfAction,
    toggleDetails,
}: Props) => {
    const { symbol } = account;

    const broadcastEnabled = precomposedForm.options.includes('broadcast');

    const state: { [key: string]: IndicatorProps['state'] } = { txid: 'active', fee: undefined };
    if (activeStep > 1) {
        state.txid = 'success';
        state.fee = activeStep > 2 ? 'success' : 'active';
    }

    const getState = (index: number, buttonRequests: number) => {
        if (index === buttonRequests - 1) return 'active';
        if (index < buttonRequests - 1) return 'success';
        return undefined;
    };

    const htmlElement = createRef<HTMLDivElement>();
    const { addNotification } = useActions({
        addNotification: notificationActions.addToast,
    });

    const success = false;

    return (
        <Content>
            <Right>
                {detailsOpen && (
                    <Detail
                        tx={precomposedTx}
                        txHash={signedTx ? signedTx.tx : undefined}
                        onClose={() => toggleDetails()}
                    />
                )}
                <RightTop>
                    <RightTopInner>
                        {outputs.map((output, index) => {
                            const state = signedTx
                                ? 'success'
                                : getState(index, buttonRequests.length);
                            // it's safe to use array index since outputs do not change
                            // eslint-disable-next-line react/no-array-index-key
                            return <Output key={index} {...output} state={state} symbol={symbol} />;
                        })}
                        {!precomposedTx.token && (
                            <OutputElement
                                lines={[
                                    {
                                        label: <Translation id="TR_TOTAL" />,
                                        value: formatNetworkAmount(
                                            precomposedTx.totalSpent,
                                            symbol,
                                        ),
                                    },
                                ]}
                                cryptoSymbol={symbol}
                                fiatSymbol={symbol}
                                fiatVisible={!isTestnet(symbol)}
                            />
                        )}
                    </RightTopInner>
                </RightTop>
                <RightBottom margin={!success} fadeOutGradient={!success} ref={htmlElement}>
                    {broadcastEnabled ? (
                        <StyledButton
                            isDisabled={!signedTx}
                            onClick={() => {
                                if (decision) decision.resolve(true);
                            }}
                        >
                            {isRbfAction ? (
                                <Translation id="TR_REPLACE_TX" />
                            ) : (
                                <Translation id="SEND_TRANSACTION" />
                            )}
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
                                }}
                            >
                                <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
                            </StyledButton>
                            <StyledButton
                                variant="secondary"
                                isDisabled={!signedTx}
                                onClick={() => download(signedTx!.tx, 'signed-transaction.txt')}
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
