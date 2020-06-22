import { AccountLabeling, FiatValue, Translation } from '@suite-components';
import { useActions, useDevice } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import { Button, colors, Modal, variables } from '@trezor/components';
import { XRP_FLAG, ZEC_SIGN_ENHANCEMENT } from '@wallet-constants/sendForm';
import { serializeEthereumTx, prepareEthereumTransaction } from '@wallet-utils/sendFormUtils';
import { Account } from '@wallet-types';
import { formatNetworkAmount, networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import TrezorConnect, { RipplePayment } from 'trezor-connect';
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
    const { account, network } = selectedAccount;
    const { networkType, symbol } = account;
    const upperCaseSymbol = account.symbol.toUpperCase();
    const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();
    const { addToast } = useActions({ addToast: notificationActions.addToast });
    const { fetchAndUpdateAccount } = useActions({
        fetchAndUpdateAccount: accountActions.fetchAndUpdateAccount,
    });
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
                        onClick={async () => {
                            // TODO refactor to functions
                            switch (networkType) {
                                case 'bitcoin':
                                    {
                                        if (!transactionInfo || transactionInfo.type !== 'final')
                                            return;
                                        const { transaction } = transactionInfo;

                                        const inputs = transaction.inputs.map(input => ({
                                            ...input,
                                            // sequence: BTC_RBF_SEQUENCE, // TODO: rbf is set
                                            // sequence: BTC_LOCKTIME_SEQUENCE, // TODO: locktime is set
                                        }));

                                        let signEnhancement = {};

                                        if (account.symbol === 'zec') {
                                            signEnhancement = ZEC_SIGN_ENHANCEMENT;
                                        }

                                        // connect undefined amount hotfix
                                        inputs.forEach(input => {
                                            if (!input.amount) delete input.amount;
                                        });

                                        const signPayload = {
                                            device: {
                                                path: device.path,
                                                instance: device.instance,
                                                state: device.state,
                                            },
                                            useEmptyPassphrase: device.useEmptyPassphrase,
                                            outputs: transaction.outputs,
                                            inputs,
                                            coin: account.symbol,
                                            ...signEnhancement,
                                        };

                                        const signedTx = await TrezorConnect.signTransaction(
                                            signPayload,
                                        );

                                        if (!signedTx.success) {
                                            addToast({
                                                type: 'sign-tx-error',
                                                error: signedTx.payload.error,
                                            });
                                            return;
                                        }

                                        // TODO: add possibility to show serialized tx without pushing (locktime)
                                        const sentTx = await TrezorConnect.pushTransaction({
                                            tx: signedTx.payload.serializedTx,
                                            coin: account.symbol,
                                        });

                                        const spentWithoutFee = new BigNumber(
                                            transactionInfo.totalSpent,
                                        )
                                            .minus(transactionInfo.fee)
                                            .toString();

                                        if (sentTx.success) {
                                            addToast({
                                                type: 'tx-sent',
                                                formattedAmount: formatNetworkAmount(
                                                    spentWithoutFee,
                                                    account.symbol,
                                                    true,
                                                ),
                                                device,
                                                descriptor: account.descriptor,
                                                symbol: account.symbol,
                                                txid: sentTx.payload.txid,
                                            });

                                            fetchAndUpdateAccount(account);
                                        } else {
                                            addToast({
                                                type: 'sign-tx-error',
                                                error: sentTx.payload.error,
                                            });
                                        }
                                    }
                                    break;
                                case 'ethereum':
                                    {
                                        const amount = getValues('amount-0');
                                        const address = getValues('address-0');
                                        const data = getValues('ethereumData');
                                        const gasPrice = getValues('ethereumGasPrice');
                                        const gasLimit = getValues('ethereumGasLimit');

                                        if (
                                            account.networkType !== 'ethereum' ||
                                            !network.chainId ||
                                            !amount ||
                                            !address
                                        )
                                            return null;

                                        console.log('amount', amount);

                                        const transaction = prepareEthereumTransaction({
                                            token,
                                            chainId: network.chainId,
                                            to: address,
                                            amount,
                                            data,
                                            gasLimit,
                                            gasPrice,
                                            nonce: account.misc.nonce,
                                        });

                                        const signedTx = await TrezorConnect.ethereumSignTransaction(
                                            {
                                                device: {
                                                    path: device.path,
                                                    instance: device.instance,
                                                    state: device.state,
                                                },
                                                useEmptyPassphrase: device.useEmptyPassphrase,
                                                path: account.path,
                                                transaction,
                                            },
                                        );

                                        if (!signedTx.success) {
                                            addToast({
                                                type: 'sign-tx-error',
                                                error: signedTx.payload.error,
                                            });
                                            return;
                                        }

                                        const serializedTx = serializeEthereumTx({
                                            ...transaction,
                                            ...signedTx.payload,
                                        });

                                        // TODO: add possibility to show serialized tx without pushing (locktime)
                                        const sentTx = await TrezorConnect.pushTransaction({
                                            tx: serializedTx,
                                            coin: network.symbol,
                                        });

                                        if (sentTx.success) {
                                            addToast({
                                                type: 'tx-sent',
                                                formattedAmount: `${amount} ${
                                                    token
                                                        ? token.symbol!.toUpperCase()
                                                        : account.symbol.toUpperCase()
                                                }`,
                                                device,
                                                descriptor: account.descriptor,
                                                symbol: account.symbol,
                                                txid: sentTx.payload.txid,
                                            });
                                            accountActions.fetchAndUpdateAccount(account);
                                        } else {
                                            addToast({
                                                type: 'sign-tx-error',
                                                error: sentTx.payload.error,
                                            });
                                        }
                                    }
                                    break;
                                case 'ripple': {
                                    const { symbol, networkType } = account;
                                    if (networkType !== 'ripple') return null;

                                    const amount = getValues('amount-0');
                                    const address = getValues('address-0');
                                    const destinationTag = getValues('rippleDestinationTag');
                                    const { path, instance, state, useEmptyPassphrase } = device;

                                    const payment: RipplePayment = {
                                        destination: address,
                                        amount: networkAmountToSatoshi(amount, symbol),
                                    };

                                    if (destinationTag) {
                                        payment.destinationTag = parseInt(destinationTag, 10);
                                    }

                                    const signedTx = await TrezorConnect.rippleSignTransaction({
                                        device: {
                                            path,
                                            instance,
                                            state,
                                        },
                                        useEmptyPassphrase,
                                        path: account.path,
                                        transaction: {
                                            fee: selectedFee.feePerUnit,
                                            flags: XRP_FLAG,
                                            sequence: account.misc.sequence,
                                            payment,
                                        },
                                    });

                                    if (!signedTx.success) {
                                        addToast({
                                            type: 'sign-tx-error',
                                            error: signedTx.payload.error,
                                        });
                                        return;
                                    }

                                    // TODO: add possibility to show serialized tx without pushing (locktime)
                                    const sentTx = await TrezorConnect.pushTransaction({
                                        tx: signedTx.payload.serializedTx,
                                        coin: account.symbol,
                                    });

                                    if (sentTx.success) {
                                        addToast({
                                            type: 'tx-sent',
                                            formattedAmount: `${amount} ${account.symbol.toUpperCase()}`,
                                            device,
                                            descriptor: account.descriptor,
                                            symbol: account.symbol,
                                            txid: sentTx.payload.txid,
                                        });

                                        fetchAndUpdateAccount(account);
                                    } else {
                                        addToast({
                                            type: 'sign-tx-error',
                                            error: sentTx.payload.error,
                                        });
                                    }
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
