import { AccountLabeling, FiatValue, Translation, FormattedCryptoAmount } from '@suite-components';
import { useDevice } from '@suite-hooks';
import { Button, colors, Modal, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
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
    font-variant-numeric: tabular-nums;
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
    send,
    account,
    modalActions,
    sendFormActionsBitcoin,
    sendFormActionsRipple,
    sendFormActionsEthereum,
}: Props) => {
    if (!account || !send) return null;
    const { outputs } = send;
    const { token } = send.networkTypeEthereum;
    const { networkType, symbol } = account;
    const transactionInfo = getTransactionInfo(account.networkType, send);
    if (!transactionInfo || transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();
    const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const fee = getFeeValue(transactionInfo, networkType, symbol);

    return (
        <Modal
            size="large"
            cancelable
            onCancel={!isDeviceLocked ? modalActions.onCancel : () => {}}
            heading={<Translation id="TR_MODAL_CONFIRM_TX_TITLE" />}
            bottomBar={
                <Buttons>
                    <Button
                        icon="ARROW_LEFT"
                        variant="secondary"
                        isDisabled={isDeviceLocked}
                        onClick={() => modalActions.onCancel()}
                    >
                        <Translation id="TR_EDIT" />
                    </Button>
                    <Button
                        isDisabled={isDeviceLocked}
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
                {outputs.map(output => {
                    const totalAmount = new BigNumber(output.amount.value || '0')
                        .plus(fee)
                        .toFixed();

                    return (
                        <OutputWrapper key={output.id}>
                            <Box>
                                <Label>
                                    <Translation id="TR_TO" />
                                </Label>
                                <Value>{output.address.value}</Value>
                            </Box>
                            <Box>
                                <Label>
                                    <Translation id="TR_TOTAL_AMOUNT" />
                                </Label>
                                <Value>
                                    <FormattedCryptoAmount
                                        value={totalAmount}
                                        symbol={outputSymbol}
                                    />
                                    <FiatValueWrapper>
                                        <FiatValue
                                            amount={totalAmount}
                                            symbol={symbol}
                                            badge={{ color: 'gray' }}
                                        />
                                    </FiatValueWrapper>
                                </Value>
                            </Box>
                        </OutputWrapper>
                    );
                })}
                <Box>
                    <Label>
                        {networkType === 'ethereum' ? (
                            <Translation id="TR_GAS_PRICE" />
                        ) : (
                            <Translation id="TR_INCLUDING_FEE" />
                        )}
                    </Label>
                    <Value>
                        <FormattedCryptoAmount value={fee} symbol={outputSymbol} />
                        <FiatValueWrapper>
                            <FiatValue amount={fee} symbol={symbol} badge={{ color: 'gray' }} />
                        </FiatValueWrapper>
                    </Value>
                </Box>
            </Content>
        </Modal>
    );
};
