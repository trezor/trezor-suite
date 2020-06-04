import { SUITE } from '@suite-actions/constants';
import { AppState, TrezorDevice } from '@suite-types';
import { Button, colors } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
import { Translation } from '@suite-components/Translation';
import React from 'react';
import styled from 'styled-components';

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
    errors: NestDataObject<Record<string, any>, FieldError>,
    locks: AppState['suite']['locks'],
    device: TrezorDevice,
    online: AppState['suite']['online'],
) => {
    // any form error
    if (errors.length > 1) {
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

interface Props {
    device: TrezorDevice;
    locks: AppState['suite']['locks'];
    online: AppState['suite']['online'];
}

export default ({ device, locks, online }: Props) => {
    const { errors } = useFormContext();
    const { openModal } = useActions({ openModal: modalActions.openModal });

    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isDisabled(errors, locks, device, online)}
                    onClick={() => openModal({ type: 'review-transaction' })}
                >
                    <Translation id="TR_SEND_REVIEW_TRANSACTION" />
                </ButtonReview>
            </Row>
        </Wrapper>
    );
};
