import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { AppState, Dispatch } from '@suite-types';
import { bindActionCreators } from 'redux';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import * as modalActions from '@suite-actions/modalActions';
import * as sendFormActionsBitcoin from '@wallet-actions/send/sendFormBitcoinActions';
import * as sendFormActionsEthereum from '@wallet-actions/send/sendFormEthereumActions';
import * as sendFormActionsRipple from '@wallet-actions/send/sendFormRippleActions';
import { H2, Button, colors, variables } from '@trezor/components-v2';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';
import { fromWei, toWei } from 'web3-utils';

const Wrapper = styled.div`
    max-width: 480px;
    padding: 40px;
`;

const Box = styled.div`
    width: 320px;
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

const VISIBLE_ADDRESS_CHAR_COUNT = 8;

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    send: state.wallet.send,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
    sendFormActionsBitcoin: bindActionCreators(sendFormActionsBitcoin, dispatch),
    sendFormActionsRipple: bindActionCreators(sendFormActionsRipple, dispatch),
    sendFormActionsEthereum: bindActionCreators(sendFormActionsEthereum, dispatch),
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type Props = StateProps & DispatchProps;

const ReviewTransaction = ({
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
    if (transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();

    return (
        <Wrapper>
            <H2>Confirm Transaction</H2>
            <Content>
                <Box>
                    <Label>From</Label>
                    <Value>
                        {upperCaseSymbol} Account #{account.index}
                    </Value>
                </Box>
                {outputs.map((output: Output) => {
                    const address = output.address.value;
                    const amount = output.amount.value;
                    if (address) {
                        const addressLength = address.length;

                        return (
                            <OutputWrapper>
                                <Box>
                                    <Label>To</Label>
                                    <Value>
                                        {address.substring(0, VISIBLE_ADDRESS_CHAR_COUNT)}...
                                        {address.substring(
                                            addressLength - VISIBLE_ADDRESS_CHAR_COUNT,
                                            addressLength,
                                        )}
                                    </Value>
                                </Box>
                                <Box>
                                    <Label>Amount</Label>
                                    <Value>
                                        {amount} {upperCaseSymbol}
                                    </Value>
                                </Box>
                            </OutputWrapper>
                        );
                    }
                    return null;
                })}
                <Box>
                    <Label>{networkType === 'ethereum' ? 'Gas price' : 'Fee'}</Label>
                    <Value>
                        {getFeeValue(transactionInfo, networkType, account.symbol)}{' '}
                        {upperCaseSymbol}
                    </Value>
                </Box>
            </Content>
            <Buttons>
                <Button variant="secondary" onClick={() => modalActions.onCancel()}>
                    Edit
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
                    Confirm Transaction
                </Button>
            </Buttons>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(ReviewTransaction);
