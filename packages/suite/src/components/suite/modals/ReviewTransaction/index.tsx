import { AccountLabeling, FiatValue, Translation } from '@suite-components';
import { useActions, useDevice } from '@suite-hooks';
import { Button, colors, Modal, variables } from '@trezor/components';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { Account } from '@wallet-types';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
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
    selectedAccount,
    getValues,
    token,
    selectedFee,
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
    const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();
    const { isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const fee = getFeeValue(transactionInfo, networkType, symbol);
    const { sendBitcoinTransaction, sendEthereumTransaction, sendRippleTransaction } = useActions({
        sendBitcoinTransaction: sendFormActions.sendBitcoinTransaction,
        sendEthereumTransaction: sendFormActions.sendEthereumTransaction,
        sendRippleTransaction: sendFormActions.sendRippleTransaction,
    });

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
                        onClick={async () => {
                            switch (networkType) {
                                case 'bitcoin':
                                    sendBitcoinTransaction(transactionInfo);
                                    break;
                                case 'ethereum':
                                    sendEthereumTransaction(getValues, token);
                                    break;
                                case 'ripple': {
                                    sendRippleTransaction(getValues, selectedFee);
                                    break;
                                } // no default
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
                {outputs.map((output, index) => (
                    <OutputWrapper key={output.id}>
                        <Box>
                            <Label>
                                <Translation id="TR_TO" />
                            </Label>
                            <Value>{getValues(`address-${index}`)}</Value>
                        </Box>
                        <Box>
                            <Label>
                                <Translation id="TR_TOTAL_AMOUNT" />
                            </Label>
                            <Value>
                                {getValues(`amount-${output.id}`)} {outputSymbol}
                                <FiatValueWrapper>
                                    <FiatValue
                                        amount={getValues(`amount-${output.id}`)}
                                        symbol={symbol}
                                        badge={{ color: 'gray' }}
                                    />
                                </FiatValueWrapper>
                            </Value>
                        </Box>
                    </OutputWrapper>
                ))}
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
