import { AccountLabeling, FiatValue, Translation } from '@suite-components';
import { useDeviceActionLocks } from '@suite-hooks';
import { Button, colors, Modal, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import BigNumber from 'bignumber.js';
import React from 'react';
import styled from 'styled-components';
import { fromWei, toWei } from 'web3-utils';

import { Props } from './Container';

const Box = styled.div`
    height: 46px;
    border-radius: 3px;
    border: solid 2px ${colors.BLACK96};
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 10px;
`;

const Symbol = styled.div`
    margin-right: 4px;
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
    width: 100%;
    margin-top: 24px;
    justify-content: space-between;
`;

const FiatValueWrapper = styled.div`
    margin-left: 10px;
    display: flex;
    flex: 1;
    justify-content: flex-end;
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

    return formatNetworkAmount(transactionInfo.fee, symbol);
};

export default ({
    modalActions,
    account,
    outputs,
    token,
    transactionInfo,
    sendFormActionsBitcoin,
    sendFormActionsRipple,
    sendFormActionsEthereum,
}: Props) => {
    if (!account) return null;
    const { networkType, symbol } = account;
    if (!transactionInfo || transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();
    const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();
    const [isEnabled] = useDeviceActionLocks();
    const fee = getFeeValue(transactionInfo, networkType, symbol);
    const { totalSpent } = transactionInfo;

    return (
        <Modal
            size="large"
            cancelable
            onCancel={isEnabled ? modalActions.onCancel : () => {}}
            heading={<Translation id="TR_MODAL_CONFIRM_TX_TITLE" />}
            bottomBar={
                <Buttons>
                    <Button
                        icon="ARROW_LEFT"
                        variant="secondary"
                        isDisabled={!isEnabled}
                        onClick={() => modalActions.onCancel()}
                    >
                        <Translation id="TR_EDIT" />
                    </Button>
                    <Button
                        isDisabled={!isEnabled}
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
                        <Translation id="TR_MODAL_CONFIRM_TX_BUTTON" />
                    </Button>
                </Buttons>
            }
        >
            <Content>
                <Box>
                    <Label>
                        <Translation id="TR_ADDRESS_FROM" />
                    </Label>
                    <Value>
                        <Symbol>{upperCaseSymbol}</Symbol> <AccountLabeling account={account} />
                    </Value>
                </Box>
                {outputs.map(output => (
                    <OutputWrapper key={output.id}>
                        <Box>
                            <Label>
                                <Translation id="TR_TO" />
                            </Label>
                            <Value>{output.address}</Value>
                        </Box>
                    </OutputWrapper>
                ))}
                <Box>
                    <Label>
                        <Translation id="TR_TOTAL_AMOUNT" />
                    </Label>
                    <Value>
                        {transactionInfo.totalSpent} {outputSymbol}
                        <FiatValueWrapper>
                            <FiatValue
                                amount={totalSpent}
                                symbol={symbol}
                                badge={{ color: 'gray' }}
                            />
                        </FiatValueWrapper>
                    </Value>
                </Box>
                <Box>
                    <Label>
                        {networkType === 'ethereum' ? (
                            <Translation id="TR_GAS_PRICE" />
                        ) : (
                            <Translation id="TR_INCLUDING_FEE" />
                        )}
                    </Label>
                    <Value>
                        {fee} {outputSymbol}
                        <FiatValueWrapper>
                            <FiatValue amount={fee} symbol={symbol} badge={{ color: 'gray' }} />
                        </FiatValueWrapper>
                    </Value>
                </Box>
            </Content>
        </Modal>
    );
};
