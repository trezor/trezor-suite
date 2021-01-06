import React, { createRef } from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { copyToClipboard, download } from '@suite-utils/dom';
import * as notificationActions from '@suite-actions/notificationActions';
import { Left, Right, Coin, Fiat, Symbol, Amounts } from './Output';
import { Account } from '@wallet-types';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    padding-top: 20px;
`;

const BottomContent = styled.div`
    padding: 20px;
    padding-top: 0px; /* Bottom padding */
    display: flex;
    justify-content: space-between;
    flex: 1;
`;

const Total = styled(Left)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Buttons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
`;

const StyledButton = styled(Button)`
    display: flex;
    align-self: center;
    width: 240px;
`;

const TotalFiat = styled(Fiat)`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

interface Props {
    symbol: Account['symbol'];
    broadcast: boolean;
    precomposedTx: PrecomposedTransactionFinal;
    signedTx?: { tx: string }; // send
    decision?: { resolve: (success: boolean) => any }; // dfd
}

const Bottom = ({ symbol, decision, broadcast, precomposedTx, signedTx }: Props) => {
    const htmlElement = createRef<HTMLDivElement>();
    const { addNotification } = useActions({
        addNotification: notificationActions.addToast,
    });

    return (
        <Wrapper>
            {!precomposedTx.token && (
                <BottomContent>
                    <Total>
                        <Translation id="TOTAL_SYMBOL" values={{ symbol: symbol.toUpperCase() }} />
                    </Total>
                    <Right>
                        <Amounts>
                            <Coin bold>
                                {formatNetworkAmount(precomposedTx.totalSpent, symbol)}
                                <Symbol>{symbol}</Symbol>
                            </Coin>
                            <TotalFiat>
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={formatNetworkAmount(precomposedTx.totalSpent, symbol)}
                                    symbol={symbol}
                                />
                            </TotalFiat>
                        </Amounts>
                    </Right>
                </BottomContent>
            )}
            {broadcast ? (
                <StyledButton
                    isDisabled={!signedTx}
                    onClick={() => {
                        if (decision) decision.resolve(true);
                    }}
                >
                    <Translation id="SEND_TRANSACTION" />
                </StyledButton>
            ) : (
                <Buttons ref={htmlElement}>
                    <StyledButton
                        isDisabled={!signedTx}
                        onClick={() => {
                            const result = copyToClipboard(signedTx!.tx, htmlElement.current);
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
                </Buttons>
            )}
        </Wrapper>
    );
};

export default Bottom;
