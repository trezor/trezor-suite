import React from 'react';
import styled from 'styled-components';
import { SUITE } from '@suite-actions/constants';
import { Button } from '@trezor/components';
import { State as SendFormState } from '@wallet-types/sendForm';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FormattedMessage } from 'react-intl';
import commonMessages from '@wallet-views/messages';
import { getStatus } from '@suite-utils/device';
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
    send: SendFormState;
    suite: AppState['suite'];
    device: TrezorDevice;
    symbol: Account['symbol'];
}

const isDisabled = (send: SendFormState, suite: AppState['suite'], device: TrezorDevice) => {
    let isDisabled = false;

    // form errors
    send.outputs.forEach(output => {
        if (output.address.error || output.amount.error) {
            isDisabled = true;
        }
    });

    if (send.customFee.error) {
        isDisabled = true;
    }

    // locks
    if (suite.locks.includes(SUITE.LOCK_TYPE.DEVICE)) {
        isDisabled = true;
    }

    // device disconnected
    if (getStatus(device) === 'disconnected') {
        isDisabled = true;
    }

    // offline
    if (!suite.online) {
        isDisabled = true;
    }

    return isDisabled;
};

const getSendText = (
    transactionInfo: SendFormState['networkTypeBitcoin']['transactionInfo'],
    symbol: Account['symbol'],
) => {
    if (transactionInfo && transactionInfo.type === 'final') {
        return `Send ${formatNetworkAmount(
            transactionInfo.totalSpent,
            symbol,
        )} ${symbol.toUpperCase()}`;
    }

    return 'Send';
};

const SendAndClear = (props: Props) => (
    <Wrapper>
        <Clear variant="white" onClick={() => props.sendFormActions.clear()}>
            <FormattedMessage {...commonMessages.TR_CLEAR} />
        </Clear>
        {props.networkType === 'bitcoin' && (
            <Button variant="white" onClick={() => props.sendFormActionsBitcoin.addRecipient()}>
                <FormattedMessage {...messages.TR_ADD_RECIPIENT} />
            </Button>
        )}
        <Send
            isDisabled={isDisabled(props.send, props.suite, props.device)}
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
            {getSendText(props.send.networkTypeBitcoin.transactionInfo, props.symbol)}
        </Send>
    </Wrapper>
);

export default SendAndClear;
