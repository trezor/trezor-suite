import React from 'react';
import styled from 'styled-components';
import {
    Translation,
    AccountLabeling,
    HiddenPlaceholder,
    FiatValue,
    Badge,
} from '@suite-components';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import { Modal, Button, colors, variables } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { useDeviceActionLocks } from '@suite-hooks';
import { Account } from '@wallet-types';

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

    return `${formatNetworkAmount(transactionInfo.fee, symbol, true)}`;
};

export default ({
    send,
    account,
    settings,
    modalActions,
    sendFormActionsBitcoin,
    sendFormActionsRipple,
    sendFormActionsEthereum,
}: Props) => {
    if (!account || !send) return null;
    const { outputs } = send;
    const { token } = send.networkTypeEthereum;
    const { networkType } = account;
    const { localCurrency } = settings;
    const transactionInfo = getTransactionInfo(account.networkType, send);
    if (!transactionInfo || transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();
    const outputSymbol = token ? token.symbol!.toUpperCase() : account.symbol.toUpperCase();
    const [isEnabled] = useDeviceActionLocks();

    return (
        <Modal
            size="large"
            cancelable
            onCancel={modalActions.onCancel}
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
                {outputs.map(output => (
                    <OutputWrapper key={output.id}>
                        <Box>
                            <Label>
                                <Translation id="TR_TO" />
                            </Label>
                            <Value>{output.address.value}</Value>
                        </Box>
                        <Box>
                            <Label>
                                <Translation id="TR_AMOUNT" />
                            </Label>
                            <Value>
                                {output.amount.value} {outputSymbol}
                                <BadgeWrapper>
                                    <HiddenPlaceholder>
                                        <FiatValue
                                            amount={output.amount.value || '0'}
                                            fiatCurrency={localCurrency}
                                            symbol={outputSymbol}
                                        >
                                            {({ value }) => <Badge isGray>{value}</Badge> ?? null}
                                        </FiatValue>
                                    </HiddenPlaceholder>
                                </BadgeWrapper>
                            </Value>
                        </Box>
                    </OutputWrapper>
                ))}
                <Box>
                    <Label>
                        {networkType === 'ethereum' ? (
                            <Translation id="TR_GAS_PRICE" />
                        ) : (
                            <Translation id="TR_FEE" />
                        )}
                    </Label>
                    <Value>{getFeeValue(transactionInfo, networkType, account.symbol)}</Value>
                </Box>
            </Content>
        </Modal>
    );
};
