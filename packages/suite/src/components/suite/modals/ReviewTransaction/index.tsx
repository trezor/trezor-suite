import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import { formatDuration } from '@suite-utils/date';
import { P, Prompt, colors, variables } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Translation } from '@suite-components/Translation';
import { AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';
import { fromWei, toWei } from 'web3-utils';

import messages from '@suite/support/messages';

const { LINE_HEIGHT, FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled.div`
    max-width: 480px;
`;

const Header = styled.div`
    padding: 30px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    border-radius: 4px;
    padding: 15px 0;
`;

const StyledP = styled(P)`
    display: flex;
    justify-content: left;
    color: ${colors.TEXT};
    font-size: ${FONT_SIZE.BASE};
    &:last-child {
        padding-bottom: 0px;
    }
`;

const Address = styled(StyledP)`
    word-wrap: break-word;
    line-height: ${LINE_HEIGHT.SMALL};
`;

const Label = styled.div`
    padding: 0 3px 6px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_SECONDARY};
`;

const Symbol = styled.div`
    text-transform: uppercase;
    font-size: ${FONT_SIZE.BIG};
`;

const Section = styled.div`
    padding: 10px 0;
    border-bottom: 1px solid ${colors.DIVIDER};

    &:last-child {
        border-bottom: 0;
    }
`;

const Heading = styled.div`
    padding: 10px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_SECONDARY};
`;

const Value = styled.div`
    font-size: ${FONT_SIZE.BIG};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    padding: 0 5px 0 0;
`;

const OutputWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    padding: 0 48px;
    justify-content: center;
`;

const mapStateToProps = (state: AppState) => ({
    send: state.wallet.send,
    account: state.wallet.selectedAccount ? state.wallet.selectedAccount.account : null,
});

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

type Props = ReturnType<typeof mapStateToProps> & { device: TrezorDevice };

const ConfirmSignTx = ({ device, send, account }: Props) => {
    if (!account || !send) return null;
    const { outputs } = send;
    const majorVersion = device.features ? device.features.major_version : 2;
    const transactionInfo = getTransactionInfo(account.networkType, send);
    if (transactionInfo.type === 'error') return null;

    return (
        <Wrapper>
            <Header>
                <Prompt model={majorVersion}>
                    <Translation
                        {...messages.TR_CONFIRM_TRANSACTION_ON}
                        values={{ deviceLabel: device.label }}
                    />
                </Prompt>
            </Header>
            <Content>
                {/* <Section>
                    <Heading>
                        <Translation {...messages.TR_SEND_LABEL} />
                    </Heading>
                    {outputs.map(output => (
                        <OutputWrapper key={output.id}>
                            <Row>
                                <Value>{`${output.amount.value || '0'} `}</Value>
                                <Symbol>{account.symbol}</Symbol>
                            </Row>
                            <Row>
                                <Label>
                                    <Translation {...messages.TR_TO_LABEL} />
                                </Label>
                                <Address>{output.address.value}</Address>
                            </Row>
                        </OutputWrapper>
                    ))}
                </Section>
                <Section>
                    <Heading>
                        <Translation {...messages.TR_FEE_LABEL} />
                    </Heading>
                    <Row>
                        <Value>
                            {transactionInfo.type !== 'error' &&
                                getFeeValue(transactionInfo, account.networkType, account.symbol)}
                        </Value>
                        <Symbol>{account.symbol}</Symbol>
                    </Row>
                </Section>
                {account.networkType === 'bitcoin' && (
                    <Section>
                        <Heading>
                            <Translation {...messages.TR_ESTIMATED_TIME} />
                        </Heading>
                        <Row>
                            <Value>
                                {formatDuration(
                                    send.feeInfo.blockTime * send.selectedFee.blocks * 60,
                                )}
                            </Value>
                        </Row>
                    </Section>
                )} */}
            </Content>
        </Wrapper>
    );
};

// onClick={() => {
//     switch (networkType) {
//         case 'bitcoin':
//             sendFormActionsBitcoin.send();
//             break;
//         case 'ethereum':
//             sendFormActionsEthereum.send();
//             break;
//         case 'ripple':
//             sendFormActionsRipple.send();
//             break;
//         // no default
//     }
// }}

export default connect(mapStateToProps)(ConfirmSignTx);
