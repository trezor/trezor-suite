import { SUITE } from '@suite-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import { AppState, TrezorDevice } from '@suite-types';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Button, colors } from '@trezor/components';
import React from 'react';
import { FieldError, NestDataObject, useFormContext } from 'react-hook-form';
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

export default () => {
    const { errors } = useFormContext();
    const { online, locks, device, outputs, token, transactionInfo } = useSendContext();
    const { openModal } = useActions({ openModal: modalActions.openModal });

    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isDisabled(errors, locks, device, online)}
                    onClick={() => {
                        if (transactionInfo && transactionInfo.type === 'final') {
                            openModal({
                                type: 'review-transaction',
                                outputs,
                                transactionInfo,
                                token,
                            });
                        }
                    }}
                >
                    <Translation id="TR_SEND_REVIEW_TRANSACTION" />
                </ButtonReview>
            </Row>
        </Wrapper>
    );
};
