import { SUITE } from '@suite-actions/constants';
import { AppState, TrezorDevice } from '@suite-types';
import { Button, colors } from '@trezor/components';
import { Account, Send } from '@wallet-types';
import { Translation } from '@suite-components/Translation';

import { getTransactionInfo } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

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

export default ({ send, suite, account, device, modalActions }: Props) => {
    if (!send || !account || !device) return null;
    const { isComposing } = send;
    const { networkType } = account;

    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isComposing || isDisabled(send, suite, device, networkType)}
                    onClick={() => modalActions.openModal({ type: 'review-transaction' })}
                    data-test="@send/review-button"
                >
                    <Translation id="TR_SEND_REVIEW_TRANSACTION" />
                </ButtonReview>
            </Row>
        </Wrapper>
    );
};
