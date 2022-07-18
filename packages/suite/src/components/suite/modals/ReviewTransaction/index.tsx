import React, { useState } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { Account } from '@wallet-types';
import { UserContextPayload } from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { OutputProps } from './components/Output';
import OutputList from './components/OutputList';
import Summary from './components/Summary';
import {
    isCardanoTx,
    getShortFingerprint,
} from '@wallet-utils/../../../../../../../suite-common/wallet-utils/src/cardanoUtils';
import { CardanoOutput } from '@trezor/connect';

const StyledModal = styled(Modal)`
    ${Modal.Body} {
        padding: 10px;
    }
    ${Modal.Content} {
        @media (min-width: ${variables.SCREEN_SIZE.SM}) {
            flex-direction: row;
        }
    }
`;

const getCardanoTokenBundle = (account: Account, output: CardanoOutput) => {
    // Transforms cardano's tokenBundle into outputs, 1 output per one token
    // since suite supports only 1 token per output it will return just one item
    if (!output.tokenBundle || output.tokenBundle.length === 0 || 'addressParameters' in output)
        return undefined;

    if (account.tokens) {
        return output.tokenBundle
            .map(policyGroup =>
                policyGroup.tokenAmounts.map(token => {
                    const accountToken = account.tokens!.find(
                        accountToken =>
                            accountToken.address ===
                            `${policyGroup.policyId}${token.assetNameBytes}`,
                    );
                    if (!accountToken) return;

                    const fingerprint = accountToken.name
                        ? getShortFingerprint(accountToken.name)
                        : undefined;

                    return {
                        type: 'cardano',
                        address: output.address,
                        balance: token.amount,
                        symbol: token.assetNameBytes
                            ? Buffer.from(token.assetNameBytes, 'hex').toString('utf8')
                            : fingerprint,
                        decimals: accountToken.decimals,
                    };
                }),
            )
            .flat();
    }
};

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type ReviewTransactionProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

export const ReviewTransaction = ({ decision }: ReviewTransactionProps) => {
    const { selectedAccount, send, fees } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        send: state.wallet.send,
        fees: state.wallet.fees,
    }));
    const { cancelSignTx } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
    });

    const [detailsOpen, setDetailsOpen] = useState(false);

    const { device } = useDevice();

    const { precomposedTx, precomposedForm, signedTx } = send;

    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx || !precomposedForm) {
        return null;
    }

    const { account } = selectedAccount;
    const { networkType } = account;
    const isRbfAction = !!precomposedTx.prevTxid;
    const decreaseOutputId = precomposedTx.useNativeRbf
        ? precomposedForm.setMaxOutputId
        : undefined;

    const outputs: OutputProps[] = [];

    if (precomposedTx.useNativeRbf) {
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid!,
            },
            {
                type: 'fee-replace',
                value: precomposedTx.feeDifference,
                value2: precomposedTx.fee,
            },
        );

        // add decrease output confirmation step between txid and fee
        if (typeof decreaseOutputId === 'number') {
            outputs.splice(1, 0, {
                type: 'reduce-output',
                label: precomposedTx.transaction.outputs[decreaseOutputId].address!,
                value: precomposedTx.feeDifference,
                value2: precomposedTx.transaction.outputs[decreaseOutputId].amount.toString(),
            });
        }
    } else if (isCardanoTx(account, precomposedTx)) {
        precomposedTx.transaction.outputs.forEach(o => {
            // iterate only through "external" outputs (change output has addressParameters field instead of address)
            if ('address' in o) {
                const tokenBundle = getCardanoTokenBundle(account, o)?.[0]; // send form supports one token per output
                outputs.push({
                    type: 'regular',
                    label: o.address,
                    value: o.amount,
                });
                outputs.push({
                    type: 'regular',
                    label: o.address,
                    value: tokenBundle ? tokenBundle.balance ?? '0' : o.amount,
                    token: tokenBundle,
                });
            }
        });
    } else {
        precomposedTx.transaction.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                outputs.push({
                    type: 'regular',
                    label: o.address,
                    value: o.amount.toString(),
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

    if (precomposedForm.ethereumDataHex && !precomposedTx.token) {
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
    } else if (!precomposedTx.useNativeRbf) {
        outputs.push({ type: 'fee', value: precomposedTx.fee });
    }

    // omit other button requests (like passphrase)
    const buttonRequests = device.buttonRequests.filter(
        r => r.code === 'ButtonRequest_ConfirmOutput' || r.code === 'ButtonRequest_SignTx',
    );

    // NOTE: T1 edge-case
    // while confirming decrease amount 'ButtonRequest_ConfirmOutput' is called twice (confirm decrease address, confirm decrease amount)
    // remove 1 additional element to keep it consistent with TT where this step is swipeable with one button request
    if (
        typeof decreaseOutputId === 'number' &&
        device.features?.major_version === 1 &&
        buttonRequests.filter(r => r.code === 'ButtonRequest_ConfirmOutput').length > 1
    ) {
        buttonRequests.splice(-1, 1);
    }

    // get estimate mining time
    let estimateTime;
    const selected = fees[selectedAccount.account.symbol];
    const matchedFeeLevel = selected.levels.find(
        item => item.feePerUnit === precomposedTx.feePerByte,
    );

    if (networkType === 'bitcoin' && matchedFeeLevel) {
        estimateTime = selected.blockTime * matchedFeeLevel.blocks * 60;
    }

    return (
        <StyledModal
            modalPrompt={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={outputs.length}
                    activeStep={signedTx ? outputs.length + 1 : buttonRequests.length}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={() => {
                        cancelSignTx();
                        decision?.resolve(false);
                    }}
                />
            }
        >
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
        </StyledModal>
    );
};
