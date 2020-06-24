import { SUITE } from '@suite-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import { Translation } from '@suite-components/Translation';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { useActions } from '@suite-hooks';
import { AppState, TrezorDevice } from '@suite-types';
import { useSendContext, SendContext } from '@suite/hooks/wallet/useSendContext';
import { Button, colors } from '@trezor/components';
import React from 'react';
import { FieldError, NestDataObject, useFormContext, useForm } from 'react-hook-form';
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
    outputs: SendContext['outputs'],
    getValues: ReturnType<typeof useForm>['getValues'],
) => {
    // any form error
    if (Object.entries(errors).length > 0) {
        return true;
    }

    let filledAddress = 0;
    let filledAmounts = 0;

    outputs.forEach(output => {
        const address = getValues(`address-${output.id}`);
        if (address && address.length > 0) {
            filledAddress++;
        }

        const amount = getValues(`amount-${output.id}`);
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
    const { errors, getValues, reset } = useFormContext();
    const { sendBitcoinTransaction, sendEthereumTransaction, sendRippleTransaction } = useActions({
        sendBitcoinTransaction: sendFormActions.sendBitcoinTransaction,
        sendEthereumTransaction: sendFormActions.sendEthereumTransaction,
        sendRippleTransaction: sendFormActions.sendRippleTransaction,
    });

    const {
        account,
        online,
        locks,
        device,
        outputs,
        token,
        isLoading,
        transactionInfo,
        selectedFee,
        setSelectedFee,
        updateOutputs,
        showAdvancedForm,
        initialSelectedFee,
        defaultValues,
        setToken,
    } = useSendContext();
    const { networkType } = account;
    const { openModal } = useActions({ openModal: modalActions.openModal });

    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isDisabled(errors, locks, device, online, outputs, getValues)}
                    isLoading={isLoading}
                    onClick={() => {
                        if (transactionInfo && transactionInfo.type === 'final') {
                            openModal({
                                type: 'review-transaction',
                                outputs,
                                transactionInfo,
                                token,
                                getValues,
                                selectedFee,
                                send: async () => {
                                    let response: 'error' | 'success';
                                    switch (networkType) {
                                        case 'bitcoin':
                                            response = await sendBitcoinTransaction(
                                                transactionInfo,
                                            );
                                            break;
                                        case 'ethereum':
                                            response = await sendEthereumTransaction(
                                                getValues,
                                                token,
                                            );
                                            break;
                                        case 'ripple': {
                                            response = await sendRippleTransaction(
                                                getValues,
                                                selectedFee,
                                            );
                                            break;
                                        } // no default
                                    }

                                    if (response !== 'error') {
                                        reset(defaultValues, { dirty: true });
                                        setSelectedFee(initialSelectedFee);
                                        showAdvancedForm(false);
                                        setToken(null);
                                        updateOutputs([
                                            {
                                                id: 0,
                                            },
                                        ]);
                                    }
                                },
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
