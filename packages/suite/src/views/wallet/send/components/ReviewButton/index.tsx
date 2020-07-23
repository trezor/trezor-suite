import { SUITE } from '@suite-actions/constants';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import { AppState, TrezorDevice } from '@suite-types';
import { useSendFormContext } from '@wallet-hooks';
import { Button, colors } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { SendContextState } from '@wallet-types/sendForm';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 25px 0;
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
    errors: SendContextState['errors'],
    locks: AppState['suite']['locks'],
    device: TrezorDevice,
    online: AppState['suite']['online'],
    outputs: SendContextState['outputs'],
    getValues: SendContextState['getValues'],
) => {
    // any form error
    if (Object.entries(errors).length > 0) {
        return true;
    }

    let filledAddress = 0;
    let filledAmounts = 0;

    outputs.forEach(output => {
        const { address, amount } = output;
        if (address && address.length > 0) {
            filledAddress++;
        }
        if (amount && amount.length > 0) {
            filledAmounts++;
        }
    });

    if (filledAddress !== outputs.length || filledAmounts !== outputs.length) {
        return true;
    }

    // locks
    if (locks.includes(SUITE.LOCK_TYPE.DEVICE)) {
        return true;
    }

    // device disconnected and not available
    if (!device.connected || !device.available) {
        return true;
    }

    // offline
    if (!online) {
        return true;
    }

    return false;
};

export default () => {
    const {
        account,
        online,
        locks,
        device,
        token,
        isLoading,
        transactionInfo,

        signTransaction,
        getValues,
        composedLevels,
    } = useSendFormContext();

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled = !composedTx;
    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    onClick={signTransaction}
                >
                    <Translation id="TR_SEND_REVIEW_TRANSACTION" />
                </ButtonReview>
            </Row>
        </Wrapper>
    );
};
