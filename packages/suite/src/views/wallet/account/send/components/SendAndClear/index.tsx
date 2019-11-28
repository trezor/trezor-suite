import React from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Button } from '@trezor/components-v2';
import { State as SendFormState } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import { Translation } from '@suite-components/Translation';
import commonMessages from '@suite/views/wallet/index.messages';
import messages from './index.messages';
import { DispatchProps } from '../../Container';
import { AppState, TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex: 1;

    justify-content: flex-end;

    & button {
        margin-left: 10px;
    }
`;

const Send = styled(Button)`
    min-width: 200px;
`;

const Clear = styled(Button)``;

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

const SendAndClear = (props: Props) => (
    <Wrapper>
        <Clear variant="secondary" onClick={() => props.sendFormActions.clear()} inlineWidth>
            <Translation>{commonMessages.TR_CLEAR}</Translation>
        </Clear>
        {props.networkType === 'bitcoin' && (
            <Button
                variant="secondary"
                onClick={() => props.sendFormActionsBitcoin.addRecipient()}
                inlineWidth
            >
                <Translation>{messages.TR_ADD_RECIPIENT}</Translation>
            </Button>
        )}
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
            inlineWidth
        >
            {getSendText(props.send, props.networkType, props.symbol)}
        </Send>
    </Wrapper>
);

export default SendAndClear;
