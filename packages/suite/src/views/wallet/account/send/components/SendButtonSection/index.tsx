import { SUITE } from '@suite-actions/constants';
import { AppState, TrezorDevice } from '@suite-types';
import { Button, colors, variables } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import {
    State as SendFormState,
    PrecomposedTransactionXrp,
    PrecomposedTransactionEth,
} from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

import EstimatedMiningTime from '../EstimatedMiningTime';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 25px;
    flex-direction: column;
`;

const Send = styled(Button)`
    min-width: 200px;
    margin-bottom: 5px;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;

    &:last-child {
        padding-bottom: 0;
    }
`;

const Fee = styled.div`
    display: flex;
    color: ${colors.BLACK50};
`;

const Bold = styled.div`
    padding-left: 4px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const isDisabled = (
    send: SendFormState,
    suite: AppState['suite'],
    device: TrezorDevice,
    networkType: Account['networkType'],
) => {
    let isDisabled = false;
    const { outputs, customFee } = send;
    const transactionInfo = getTransactionInfo(networkType, send);

    // compose error or progress
    if (!transactionInfo || transactionInfo.type !== 'final') {
        isDisabled = true;
    }

    // form errors
    outputs.forEach(output => {
        if (output.address.error || output.amount.error) {
            isDisabled = true;
        }
    });

    // error in advanced form
    if (customFee.error) {
        isDisabled = true;
    }

    // error in advanced eth form
    if (networkType === 'ethereum') {
        const { gasPrice, gasLimit, data } = send.networkTypeEthereum;
        if (gasPrice.error || gasLimit.error || data.error) {
            isDisabled = true;
        }
    }

    // locks
    if (suite.locks.includes(SUITE.LOCK_TYPE.DEVICE)) {
        isDisabled = true;
    }

    // device disconnected and not available
    if (!device.connected || !device.available) {
        isDisabled = true;
    }

    // offline
    if (!suite.online) {
        isDisabled = true;
    }

    return isDisabled;
};

const getSendText = (
    transactionInfo: PrecomposedTransactionXrp | PrecomposedTransactionEth,
    symbol: Account['symbol'],
) => {
    if (transactionInfo && transactionInfo.type !== 'error') {
        return `Send ${formatNetworkAmount(
            transactionInfo.totalSpent,
            symbol,
        )} ${symbol.toUpperCase()}`;
    }

    return 'Send';
};

const SendSection = ({
    send,
    suite,
    account,
    device,
    sendFormActionsBitcoin,
    sendFormActionsEthereum,
    sendFormActionsRipple,
}: Props) => {
    if (!send || !account || !device) return null;
    const { isComposing, customFee } = send;
    const { networkType, symbol } = account;
    const transactionInfo = getTransactionInfo(networkType, send);

    return (
        <Wrapper>
            <Row>
                <Send
                    isLoading={isComposing}
                    isDisabled={isComposing || isDisabled(send, suite, device, networkType)}
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
                    {getSendText(transactionInfo, symbol)}
                </Send>
            </Row>
            {transactionInfo?.type === 'final' && (
                <Row>
                    <Fee>
                        Including fee of{' '}
                        <Bold>{formatNetworkAmount(transactionInfo.fee, symbol)}</Bold>
                    </Fee>
                </Row>
            )}
            {networkType === 'bitcoin' && customFee.value && (
                <Row>
                    <EstimatedMiningTime
                        seconds={send.feeInfo.blockTime * send.selectedFee.blocks * 60}
                    />
                </Row>
            )}
        </Wrapper>
    );
};

export default SendSection;
