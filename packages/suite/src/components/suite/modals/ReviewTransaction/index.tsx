import { FiatValue, Translation } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import { colors, Modal, variables, ConfirmOnDevice, Box, Button, Icon } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFee } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

import * as sendFormActions from '@wallet-actions/sendFormActions';

import { Props } from './Container';

const StyledRow = styled(Box)<{ noBottomPadding?: boolean }>`
    justify-content: space-between;
    margin-bottom: ${props => (props.noBottomPadding ? '0' : '20px')};
`;

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const IconWrapper = styled.div`
    width: 25px;
    height: 25px;
    display: flex;
    padding-right: 6px;
    justify-content: center;
    align-items: center;
`;

const Dot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background: ${colors.NEUE_TYPE_ORANGE};
`;

const Address = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Right = styled.div`
    display: flex;
    align-items: center;
`;

const Bottom = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const BottomContent = styled.div`
    padding: 20px 37px;
    display: flex;
    justify-content: space-between;
    flex: 1;
`;

const Content = styled.div`
    padding: 20px 20px 0 20px;
`;

const OutputWrapper = styled.div`
    border-radius: 3px;
`;

const Coin = styled.div<{ bold?: boolean }>`
    display: flex;
    font-weight: ${props =>
        props.bold ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    align-items: center;
`;

const Symbol = styled.div`
    text-transform: uppercase;
    padding-left: 4px;
`;

const Fiat = styled.div`
    display: flex;
    align-items: center;
    padding-top: 5px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const StyledButton = styled(Button)`
    display: flex;
    align-self: center;
    width: 240px;
`;

const getState = (index: number, buttonRequests: number) => {
    if (index === buttonRequests - 1) {
        return 'warning';
    }

    if (index < buttonRequests - 1) {
        return 'success';
    }

    return undefined;
};

export default ({ selectedAccount, send, ...props }: Props) => {
    const { device } = useDevice();
    const { cancelSignTx, pushTransaction } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
        pushTransaction: sendFormActions.pushTransaction,
    });
    const { precomposedTx, signedTx } = send;
    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx) return null;

    const outputs = precomposedTx.transaction.outputs.filter(
        o => typeof o.address === 'string' || o.script_type === 'PAYTOOPRETURN',
    );

    const { account } = selectedAccount;
    const { networkType, symbol } = account;
    const upperCaseSymbol = account.symbol.toUpperCase();
    // const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();

    const fee = getFee(precomposedTx, networkType, symbol);
    // omit other button requests (like passphrase)
    const expectedRequests = outputs.length + 1; // outputs + final confirmation (total and fee)
    const buttonRequests = device.buttonRequests.filter(
        r => r === 'ButtonRequest_ConfirmOutput' || r === 'ButtonRequest_SignTx',
    );

    return (
        <Modal
            size="large"
            padding={['20px', '0', '20px', '0']}
            header={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={expectedRequests}
                    activeStep={buttonRequests.length}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={cancelSignTx}
                />
            }
            bottomBar={
                <Bottom>
                    <BottomContent>
                        <Left>
                            <Translation
                                id="TR_TOTAL_SYMBOL"
                                values={{ symbol: upperCaseSymbol }}
                            />
                        </Left>
                        <Right>
                            <Coin bold>
                                {formatNetworkAmount(precomposedTx.totalSpent, symbol)}
                                <Symbol>{symbol}</Symbol>
                            </Coin>
                            <Fiat>
                                <FiatValue
                                    amount={formatNetworkAmount(precomposedTx.totalSpent, symbol)}
                                    symbol={symbol}
                                />
                            </Fiat>
                        </Right>
                    </BottomContent>
                    <StyledButton
                        isDisabled={!signedTx}
                        onClick={async () => {
                            const result = await pushTransaction();
                            // @ts-ignore: type modal decision
                            props.decision.resolve(result);
                        }}
                    >
                        <Translation id="TR_SEND" />
                    </StyledButton>
                </Bottom>
            }
        >
            <Content>
                {outputs.map((output, index) => {
                    const state = getState(index, buttonRequests.length);

                    return (
                        <OutputWrapper key={output.id}>
                            <StyledRow>
                                <Left>
                                    <IconWrapper>
                                        {state === 'success' && (
                                            <Icon color={colors.NEUE_BG_GREEN} icon="CHECK" />
                                        )}
                                        {state === 'warning' && <Dot />}
                                    </IconWrapper>
                                    <Address>{output.op_return_data || output.address}</Address>
                                </Left>
                                <Right>
                                    <Coin>
                                        {/* @ts-ignore */}
                                        {formatNetworkAmount(output.amount, symbol)}
                                        <Symbol>{symbol}</Symbol>
                                    </Coin>
                                    <Fiat>
                                        <FiatValue
                                            // @ts-ignore
                                            amount={formatNetworkAmount(output.amount, symbol)}
                                            symbol={symbol}
                                        />
                                    </Fiat>
                                </Right>
                            </StyledRow>
                        </OutputWrapper>
                    );
                })}
                <StyledRow noBottomPadding>
                    <Left>
                        <IconWrapper />
                        <Translation id="TR_FEE" />
                    </Left>
                    <Right>
                        <Coin>
                            {fee}
                            <Symbol>{symbol}</Symbol>
                        </Coin>
                        <Fiat>
                            <FiatValue amount={fee} symbol={symbol} />
                        </Fiat>
                    </Right>
                </StyledRow>
            </Content>
        </Modal>
    );
};
