import React from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Button, colors, variables } from '@trezor/components-v2';
import { State as SendFormState } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import { DispatchProps } from '../../Container';
import EstimatedMiningTime from '../EstimatedMiningTime';
import { AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';

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

interface Props {
    sendFormActions: DispatchProps['sendFormActions'];
    sendFormActionsBitcoin: DispatchProps['sendFormActionsBitcoin'];
    sendFormActionsEthereum: DispatchProps['sendFormActionsEthereum'];
    sendFormActionsRipple: DispatchProps['sendFormActionsRipple'];
    networkType: Account['networkType'];
    isComposing: SendFormState['isComposing'];
    send: SendFormState;
    suite: AppState['suite'];
    device: TrezorDevice;
    symbol: Account['symbol'];
}

const isDisabled = (
    send: SendFormState,
    suite: AppState['suite'],
    device: TrezorDevice,
    networkType: Account['networkType'],
) => {
    let isDisabled = false;

    const transactionInfo = getTransactionInfo(networkType, send);

    // compose error or progress
    if (!transactionInfo || transactionInfo.type !== 'final') {
        isDisabled = true;
    }

    // form errors
    send.outputs.forEach(output => {
        if (output.address.error || output.amount.error) {
            isDisabled = true;
        }
    });

    // error in advanced form
    if (send.customFee.error) {
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
    send: SendFormState,
    networkType: Account['networkType'],
    symbol: Account['symbol'],
) => {
    const transactionInfo = getTransactionInfo(networkType, send);
    if (transactionInfo && transactionInfo.type !== 'error') {
        return `Send ${formatNetworkAmount(
            transactionInfo.totalSpent,
            symbol,
        )} ${symbol.toUpperCase()}`;
    }

    return 'Send';
};

const SendSection = (props: Props) => (
    <Wrapper>
        <Row>
            <Send
                isLoading={props.isComposing}
                isDisabled={
                    props.isComposing ||
                    isDisabled(props.send, props.suite, props.device, props.networkType)
                }
                onClick={() => {
                    switch (props.networkType) {
                        case 'bitcoin':
                            props.sendFormActionsBitcoin.send();
                            break;
                        case 'ethereum':
                            props.sendFormActionsEthereum.send();
                            break;
                        case 'ripple':
                            props.sendFormActionsRipple.send();
                            break;
                        // no default
                    }
                }}
            >
                {getSendText(props.send, props.networkType, props.symbol)}
            </Send>
        </Row>
        <Row>
            <Fee>
                Including fee of <Bold>0.000002 BTC = 0.56 USD</Bold>
            </Fee>
        </Row>
        {props.networkType === 'bitcoin' && (
            <Row>
                <EstimatedMiningTime
                    seconds={props.send.feeInfo.blockTime * props.send.selectedFee.blocks * 60}
                />
            </Row>
        )}
    </Wrapper>
);

export default SendSection;
