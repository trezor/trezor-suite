import { FiatValue, Translation } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import { colors, Modal, variables, ConfirmOnDevice, Box, Button } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFee } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

import * as sendFormActions from '@wallet-actions/sendFormActions';

import { Props } from './Container';

const StyledRow = styled(Box)`
    justify-content: space-between;
    margin-bottom: 20px;
`;

const Left = styled.div`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
`;

const Right = styled.div``;

const Bottom = styled.div`
    justify-content: space-between;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Content = styled.div`
    padding: 20px;
`;

const OutputWrapper = styled.div`
    background: ${colors.BLACK96};
    border-radius: 3px;
`;

const Coin = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const Symbol = styled.div`
    text-transform: uppercase;
    padding-left: 4px;
`;

const Fiat = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export default ({ selectedAccount, send, ...props }: Props) => {
    const { device } = useDevice();
    const { cancelSignTx, pushTransaction } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
        pushTransaction: sendFormActions.pushTransaction,
    });
    const { precomposedTx, signedTx } = send;
    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx) return null;

    const outputs = precomposedTx.transaction.outputs.filter(o => typeof o.address === 'string');

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
                    <Left>
                        <Translation id="TR_TOTAL_SYMBOL" values={{ symbol: upperCaseSymbol }} />
                    </Left>
                    <Right>
                        <Coin>
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
                </Bottom>
            }
        >
            <Content>
                {outputs.map((output, index) => (
                    <OutputWrapper key={output.id}>
                        <StyledRow>
                            <Left>
                                {index === buttonRequests.length - 1 && (
                                    <div>TODO: ACTIVE CHECKMARK</div>
                                )}
                                {output.address}
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
                ))}
                <StyledRow>
                    <Left>
                        {expectedRequests === buttonRequests.length && (
                            <div>TODO: ACTIVE CHECKMARK</div>
                        )}
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
                <StyledRow>
                    <Button
                        isDisabled={!signedTx}
                        onClick={async () => {
                            const result = await pushTransaction();
                            // @ts-ignore: type modal decision
                            props.decision.resolve(result);
                        }}
                    >
                        <Translation id="TR_SEND" />
                    </Button>
                </StyledRow>
            </Content>
        </Modal>
    );
};
