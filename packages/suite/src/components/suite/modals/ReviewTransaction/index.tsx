import { AccountLabeling, Badge, Translation } from '@suite-components';
import { useDeviceActionLocks } from '@suite-hooks';
import { Button, colors, Modal, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
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

const BadgeWrapper = styled.div`
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
    settings,
    modalActions,
    sendFormActionsBitcoin,
    sendFormActionsRipple,
    sendFormActionsEthereum,
    fiat,
}: Props) => {
    if (!account || !send) return null;
    const { outputs } = send;
    const { token } = send.networkTypeEthereum;
    const { networkType } = account;
    const { localCurrency } = settings;
    const transactionInfo = getTransactionInfo(account.networkType, send);
    if (!transactionInfo || transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();
    const fiatVal = fiat.find(fiatItem => fiatItem.symbol === account.symbol);
    const outputSymbol = token ? token.symbol!.toUpperCase() : account.symbol.toUpperCase();
    const [isEnabled] = useDeviceActionLocks();
    const fee = getFeeValue(transactionInfo, networkType, account.symbol);

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
                        {upperCaseSymbol} <AccountLabeling account={account} />
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
                                    {totalAmount} {outputSymbol}
                                    {output.amount.value && fiatVal && networkType !== 'ethereum' && (
                                        <BadgeWrapper>
                                            <Badge isGray>
                                                {toFiatCurrency(
                                                    totalAmount,
                                                    localCurrency,
                                                    fiatVal.current?.rates,
                                                    true,
                                                )}{' '}
                                                {localCurrency.toUpperCase()}
                                            </Badge>
                                        </BadgeWrapper>
                                    )}
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
                        {getFeeValue(transactionInfo, networkType, account.symbol)} {outputSymbol}
                        {fee && fiatVal && networkType !== 'ethereum' && (
                            <BadgeWrapper>
                                <Badge isGray>
                                    {toFiatCurrency(
                                        fee,
                                        localCurrency,
                                        fiatVal.current?.rates,
                                        true,
                                    )}{' '}
                                    {localCurrency.toUpperCase()}
                                </Badge>
                            </BadgeWrapper>
                        )}
                    </Value>
                </Box>
            </Content>
        </Modal>
    );
};
