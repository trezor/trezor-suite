import { SUITE } from '@suite-actions/constants';
import * as modalActions from '@suite-actions/modalActions';
import { Translation } from '@suite-components/Translation';
import { useActions } from '@suite-hooks';
import { AppState, TrezorDevice } from '@suite-types';
import { useSendFormContext } from '@wallet-hooks';
import { Button, colors } from '@trezor/components';
import * as sendFormActions from '@wallet-actions/sendFormActions';
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

        getValues,
        composedLevels,
        resetContext,
    } = useSendFormContext();

    const {
        signTransaction,
        sendBitcoinTransaction,
        sendEthereumTransaction,
        sendRippleTransaction,
    } = useActions({
        signTransaction: sendFormActions.signTransaction,
        sendBitcoinTransaction: sendFormActions.sendBitcoinTransaction,
        sendEthereumTransaction: sendFormActions.sendEthereumTransaction,
        sendRippleTransaction: sendFormActions.sendRippleTransaction,
    });
    // const { networkType } = account;
    const { openDeferredModal } = useActions({ openDeferredModal: modalActions.openDeferredModal });

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled = !composedTx;
    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    onClick={async () => {
                        if (composedTx && composedTx.type === 'final') {
                            // signTransaction > sign[COIN]Transaction > requestPush (modal with promise)
                            const result = await signTransaction(composedTx);
                            if (result) {
                                resetContext();
                            }
                        }
                        // sendBitcoinTransaction({
                        //     type: 'final',
                        //     transaction: {
                        //         inputs: [
                        //             {
                        //                 address_n: [2147483732, 2147483649, 2147483648, 1, 2],
                        //                 amount: '249356',
                        //                 prev_hash:
                        //                     '352873fe6cd5a83ca4b02737848d7d839aab864b8223c5ba7150ae35c22f4e38',
                        //                 prev_index: 4,
                        //                 script_type: 'SPENDWITNESS',
                        //                 sequence: 4294967295,
                        //             },
                        //         ],
                        //         outputs: [
                        //             {
                        //                 address: 'tb1qf8hrrz6yy6ug5qenhndpsta87t57lnqk4ngswx',
                        //                 amount: '100000',
                        //                 script_type: 'PAYTOADDRESS',
                        //             },
                        //             {
                        //                 address_n: [2147483732, 2147483649, 2147483648, 1, 3],
                        //                 amount: '149190',
                        //                 script_type: 'PAYTOWITNESS',
                        //             },
                        //         ],
                        //     },
                        // });

                        // const decision = await openDeferredModal({ type: 'review-transaction' });
                        // console.warn('DECISION', decision);
                        // if (decision) {
                        // }

                        if (transactionInfo && transactionInfo.type === 'final') {
                            // openModal({
                            //     type: 'review-transaction',
                            //     outputs,
                            //     transactionInfo,
                            //     token,
                            //     getValues,
                            //     selectedFee,
                            //     send: async () => {
                            //         let response: 'error' | 'success';
                            //         switch (networkType) {
                            //             case 'bitcoin':
                            //                 response = await sendBitcoinTransaction(
                            //                     transactionInfo,
                            //                 );
                            //                 break;
                            //             case 'ethereum':
                            //                 response = await sendEthereumTransaction(
                            //                     getValues,
                            //                     token,
                            //                 );
                            //                 break;
                            //             case 'ripple': {
                            //                 response = await sendRippleTransaction(
                            //                     getValues,
                            //                     selectedFee,
                            //                 );
                            //                 break;
                            //             } // no default
                            //         }
                            //         if (response !== 'error') {
                            //             reset();
                            //         }
                            //     },
                            // });
                        }
                    }}
                >
                    <Translation id="TR_SEND_REVIEW_TRANSACTION" />
                </ButtonReview>
            </Row>
        </Wrapper>
    );
};
