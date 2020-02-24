import { SUITE } from '@suite-actions/constants';
import { AppState, TrezorDevice } from '@suite-types';
import { Button, colors, variables } from '@trezor/components';
import { Account, Send } from '@wallet-types';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { PrecomposedTransactionXrp, PrecomposedTransactionEth } from '@wallet-types/sendForm';
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

const ButtonReview = styled(Button)`
    min-width: 200px;
    margin-bottom: 5px;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;
    color: ${colors.BLACK50};

    &:last-child {
        padding-bottom: 0;
    }
`;

const Bold = styled.div`
    padding-left: 4px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const isDisabled = (
    send: Send,
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
        if (
            !output.address.value ||
            !output.amount.value ||
            output.address.error ||
            output.amount.error
        ) {
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

const getSendAmount = (
    transactionInfo: PrecomposedTransactionXrp | PrecomposedTransactionEth,
    symbol: Account['symbol'],
) => {
    if (transactionInfo && transactionInfo.type !== 'error') {
        return `${formatNetworkAmount(transactionInfo.totalSpent, symbol)} ${symbol.toUpperCase()}`;
    }

    return null;
};

export default ({ send, suite, account, device, modalActions }: Props) => {
    if (!send || !account || !device) return null;
    const { isComposing, customFee } = send;
    const { networkType, symbol } = account;
    const transactionInfo = getTransactionInfo(networkType, send);

    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isLoading={isComposing}
                    isDisabled={isComposing ? false : isDisabled(send, suite, device, networkType)}
                    onClick={() => modalActions.openModal({ type: 'review-transaction' })}
                >
                    <Translation {...messages.TR_SEND_REVIEW_TRANSACTION} />
                </ButtonReview>
            </Row>
            {transactionInfo?.type === 'final' && (
                <>
                    <Row>
                        Send <Bold>{getSendAmount(transactionInfo, symbol)}</Bold>
                    </Row>
                    <Row>
                        Including fee of{' '}
                        <Bold>{formatNetworkAmount(transactionInfo.fee, symbol)}</Bold>
                    </Row>
                    {networkType === 'bitcoin' && !customFee.value && (
                        <Row>
                            <EstimatedMiningTime
                                seconds={send.feeInfo.blockTime * send.selectedFee.blocks * 60}
                            />
                        </Row>
                    )}
                </>
            )}
        </Wrapper>
    );
};
