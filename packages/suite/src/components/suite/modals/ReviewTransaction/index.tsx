import React from 'react';
import styled from 'styled-components';
import { Translation, AccountLabeling } from '@suite-components';
import messages from '@suite/support/messages';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import { H2, Button, colors, variables } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import { fromWei, toWei } from 'web3-utils';
import { Props } from './Container';

const Wrapper = styled.div`
    padding: 40px;
`;

const Box = styled.div`
    height: 46px;
    border-radius: 3px;
    border: solid 2px ${colors.BLACK96};
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 10px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-width: 80px;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Value = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    align-items: center;
    flex: 1;
`;

const Content = styled.div`
    margin-top: 16px;
`;

const OutputWrapper = styled.div`
    background: ${colors.BLACK96};
    border-radius: 3px;
`;

const Buttons = styled.div`
    display: flex;
    margin-top: 24px;
    justify-content: space-between;
`;

const getFeeValue = (
    transactionInfo: any,
    networkType: Account['networkType'],
    symbol: Account['symbol'],
) => {
    if (networkType === 'ethereum') {
        const gasPriceInWei = toWei(transactionInfo.feePerUnit, 'gwei');
        return fromWei(gasPriceInWei, 'ether');
    }

    return `${formatNetworkAmount(transactionInfo.fee, symbol)}`;
};

export default ({
    send,
    account,
    modalActions,
    sendFormActionsBitcoin,
    sendFormActionsRipple,
    sendFormActionsEthereum,
}: Props) => {
    if (!account || !send) return null;
    const { outputs } = send;
    const { networkType } = account;
    const transactionInfo = getTransactionInfo(account.networkType, send);
    if (!transactionInfo || transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();

    return (
        <Wrapper>
            <H2>
                <Translation {...messages.TR_MODAL_CONFIRM_TX_TITLE} />
            </H2>
            <Content>
                <Box>
                    <Label>
                        <Translation {...messages.TR_ADDRESS_FROM} />
                    </Label>
                    <Value>
                        {upperCaseSymbol} <AccountLabeling account={account} />
                    </Value>
                </Box>
                {outputs.map(output => (
                    <OutputWrapper key={output.id}>
                        <Box>
                            <Label>
                                <Translation {...messages.TR_TO} />
                            </Label>
                            <Value>{output.address.value}</Value>
                        </Box>
                        <Box>
                            <Label>
                                <Translation {...messages.TR_AMOUNT} />
                            </Label>
                            <Value>
                                {output.amount.value} {upperCaseSymbol}
                            </Value>
                        </Box>
                    </OutputWrapper>
                ))}
                <Box>
                    <Label>
                        {networkType === 'ethereum' ? (
                            <Translation {...messages.TR_GAS_PRICE} />
                        ) : (
                            <Translation {...messages.TR_FEE} />
                        )}
                    </Label>
                    <Value>
                        {getFeeValue(transactionInfo, networkType, account.symbol)}{' '}
                        {upperCaseSymbol}
                    </Value>
                </Box>
            </Content>
            <Buttons>
                <Button
                    icon="ARROW_LEFT"
                    variant="secondary"
                    onClick={() => modalActions.onCancel()}
                >
                    <Translation {...messages.TR_EDIT} />
                </Button>
                <Button
                    onClick={() => {
                        switch (networkType) {
                            case 'bitcoin':
                                sendFormActionsBitcoin.send();
                                break;
                            case 'ethereum':
                                sendFormActionsEthereum.send();
                                break;
                            case 'ripple':
                                sendFormActionsRipple.send();
                                break;
                            // no default
                        }
                    }}
                >
                    <Translation {...messages.TR_MODAL_CONFIRM_TX_BUTTON} />
                </Button>
            </Buttons>
        </Wrapper>
    );
};
