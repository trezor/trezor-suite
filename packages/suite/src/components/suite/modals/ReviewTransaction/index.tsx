import { FiatValue, Translation } from '@suite-components';
import { useDevice } from '@suite-hooks';
import { colors, Modal, variables, ConfirmOnDevice, Row } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFee } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

import { Props } from './Container';

const StyledRow = styled(Row)`
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

export default ({
    modalActions,
    selectedAccount,
    token,
    outputs,
    transactionInfo,
    device,
}: Props) => {
    if (
        selectedAccount.status !== 'loaded' ||
        !device ||
        !transactionInfo ||
        transactionInfo.type === 'error'
    )
        return null;

    const { account } = selectedAccount;
    const { networkType, symbol } = account;
    const upperCaseSymbol = account.symbol.toUpperCase();
    // const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const fee = getFee(transactionInfo, networkType, symbol);

    return (
        <Modal
            size="large"
            cancelable
            padding={['20px', '0', '20px', '0']}
            header={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={outputs.length}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={!isDeviceLocked ? modalActions.onCancel : () => {}}
                />
            }
            bottomBar={
                <Bottom>
                    <Left>
                        <Translation id="TR_TOTAL_SYMBOL" values={{ symbol: upperCaseSymbol }} />
                    </Left>
                    <Right>
                        <Coin>
                            {/* @ts-ignore */}
                            {formatNetworkAmount(transactionInfo.totalSent, symbol)}
                            <Symbol>{symbol}</Symbol>
                        </Coin>
                        <Fiat>
                            <FiatValue
                                // @ts-ignore
                                amount={formatNetworkAmount(transactionInfo.totalSent, symbol)}
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
                            <Left>address</Left>
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
