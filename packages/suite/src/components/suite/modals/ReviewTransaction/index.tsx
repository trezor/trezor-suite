import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { UserContextPayload } from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import Output, { OutputProps } from './components/Output';
import Detail from './components/Detail';
import ChangeFee from './components/ChangeFee';
import Bottom from './components/Bottom';

const Content = styled.div`
    padding: 20px 20px 0 20px;
`;

const getState = (index: number, buttonRequests: number) => {
    if (index === buttonRequests - 1) return 'active';
    if (index < buttonRequests - 1) return 'success';
    return undefined;
};

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type Props =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

const ReviewTransaction = ({ decision }: Props) => {
    const { device } = useDevice();
    const { cancelSignTx } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
    });
    const { selectedAccount, send } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        send: state.wallet.send,
    }));

    const { precomposedTx, precomposedForm, signedTx } = send;
    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx || !precomposedForm)
        return null;

    const { symbol, networkType } = selectedAccount.account;
    const broadcastEnabled = precomposedForm.options.includes('broadcast');
    const rbfAvailable =
        networkType === 'bitcoin' &&
        precomposedTx.prevTxid &&
        !device.unavailableCapabilities?.replaceTransaction;

    const outputs: OutputProps[] = [];
    if (precomposedTx.prevTxid && rbfAvailable) {
        outputs.push({
            type: 'txid',
            value: precomposedTx.prevTxid,
        });
    } else {
        precomposedTx.transaction.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                outputs.push({
                    type: 'regular',
                    label: o.address,
                    value: o.amount,
                    token: precomposedTx.token,
                });
            } else if (o.script_type === 'PAYTOOPRETURN') {
                outputs.push({
                    type: 'opreturn',
                    value: o.op_return_data,
                });
            }
        });
    }

    if (precomposedForm.bitcoinLockTime) {
        outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLockTime });
    }

    if (precomposedForm.ethereumDataHex) {
        outputs.push({ type: 'data', value: precomposedForm.ethereumDataHex });
    }

    if (networkType === 'ripple') {
        // ripple displays requests on device in different order:
        // 1. destination tag
        // 2. fee
        // 3. output
        outputs.unshift({ type: 'fee', value: precomposedTx.fee });
        if (precomposedForm.rippleDestinationTag) {
            outputs.unshift({
                type: 'destination-tag',
                value: precomposedForm.rippleDestinationTag,
            });
        }
    } else {
        outputs.push({ type: 'fee', value: precomposedTx.fee });
    }

    // omit other button requests (like passphrase)
    const buttonRequests = device.buttonRequests.filter(
        r => r === 'ButtonRequest_ConfirmOutput' || r === 'ButtonRequest_SignTx',
    );

    return (
        <Modal
            noPadding
            size="large"
            header={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={outputs.length}
                    activeStep={signedTx ? outputs.length + 1 : buttonRequests.length}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    animated
                    onCancel={cancelSignTx}
                />
            }
            bottomBar={
                !rbfAvailable && (
                    <Bottom
                        symbol={symbol}
                        broadcast={broadcastEnabled}
                        precomposedTx={precomposedTx}
                        signedTx={signedTx}
                        decision={decision}
                    />
                )
            }
        >
            {rbfAvailable ? (
                <ChangeFee
                    activeStep={signedTx ? outputs.length + 1 : buttonRequests.length}
                    account={selectedAccount.account}
                    precomposedForm={precomposedForm}
                    precomposedTx={precomposedTx}
                    signedTx={signedTx}
                    decision={decision}
                />
            ) : (
                <Content>
                    {outputs.map((output, index) => {
                        const state = signedTx ? 'success' : getState(index, buttonRequests.length);
                        // it's safe to use array index since outputs do not change
                        // eslint-disable-next-line react/no-array-index-key
                        return <Output key={index} {...output} state={state} symbol={symbol} />;
                    })}
                    <Detail tx={precomposedTx} txHash={signedTx ? signedTx.tx : undefined} />
                </Content>
            )}
        </Modal>
    );
};

export default ReviewTransaction;
