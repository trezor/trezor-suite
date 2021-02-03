import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { ConfirmOnDevice } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { UserContextPayload } from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { OutputProps } from './components/Output';
import OutputList from './components/OutputList';
import Summary from './components/Summary';

const ModalInner = styled.div`
    display: flex;
    padding: 10px;
`;

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type Props =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

const ReviewTransaction = ({ decision }: Props) => {
    const { device } = useDevice();
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const { cancelSignTx } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
    });
    const { selectedAccount, send, fees } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        send: state.wallet.send,
        fees: state.wallet.fees,
    }));

    const { precomposedTx, precomposedForm, signedTx } = send;
    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx || !precomposedForm)
        return null;

    const { networkType } = selectedAccount.account;
    const rbfAvailable =
        networkType === 'bitcoin' &&
        precomposedTx.prevTxid &&
        !device.unavailableCapabilities?.replaceTransaction;

    const outputs: OutputProps[] = [];
    if (precomposedTx.prevTxid && rbfAvailable) {
        // calculate fee difference
        const diff = new BigNumber(precomposedTx.fee)
            .minus(precomposedForm.rbfParams?.baseFee || 0)
            .toFixed();
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid,
            },
            {
                type: 'fee-replace',
                value: diff,
                value2: precomposedTx.fee,
            },
        );
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
    } else if (!rbfAvailable) {
        outputs.push({ type: 'fee', value: precomposedTx.fee });
    }

    // omit other button requests (like passphrase)
    const buttonRequests = device.buttonRequests.filter(
        r => r === 'ButtonRequest_ConfirmOutput' || r === 'ButtonRequest_SignTx',
    );

    // changing fee rate using RBF
    const isRbfAction =
        precomposedForm.rbfParams &&
        parseInt(precomposedForm.rbfParams.feeRate, 10) < parseInt(precomposedTx.feePerByte, 10);

    // get estimate minig time
    let estimateTime;
    const selected = fees[selectedAccount.account.symbol];
    const matchedFeeLevel = selected.levels.find(
        item => item.feePerUnit === precomposedTx.feePerByte,
    );
    if (networkType === 'bitcoin' && matchedFeeLevel) {
        estimateTime = selected.blockTime * matchedFeeLevel.blocks * 60;
    }

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
        >
            <ModalInner>
                <Summary
                    estimateTime={estimateTime}
                    tx={precomposedTx}
                    account={selectedAccount.account}
                    network={selectedAccount.network}
                    broadcast={precomposedForm.options.includes('broadcast')}
                    detailsOpen={detailsOpen}
                    isRbfAction={isRbfAction}
                    onDetailsClick={() => setDetailsOpen(!detailsOpen)}
                />
                <OutputList
                    activeStep={signedTx ? outputs.length + 1 : buttonRequests.length}
                    account={selectedAccount.account}
                    precomposedForm={precomposedForm}
                    precomposedTx={precomposedTx}
                    signedTx={signedTx}
                    decision={decision}
                    detailsOpen={detailsOpen}
                    outputs={outputs}
                    buttonRequests={buttonRequests}
                    isRbfAction={isRbfAction}
                    toggleDetails={() => setDetailsOpen(!detailsOpen)}
                />
            </ModalInner>
        </Modal>
    );
};

export default ReviewTransaction;
