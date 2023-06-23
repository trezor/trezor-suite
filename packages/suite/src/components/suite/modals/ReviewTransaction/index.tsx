import React, { useState } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, variables } from '@trezor/components';
import { Translation, Modal } from 'src/components/suite';
import { useActions, useSelector } from 'src/hooks/suite';
import { UserContextPayload } from 'src/actions/suite/modalActions';
import * as sendFormActions from 'src/actions/wallet/sendFormActions';
import OutputList from './components/OutputList';
import Summary from './components/Summary';
import { isCardanoTx } from 'src/utils/wallet/cardanoUtils';
import { DeviceModel, getDeviceModel } from '@trezor/device-utils';
import { selectDevice, selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { constructOutputs } from './constructOutputs';

const StyledModal = styled(Modal)`
    ${Modal.Body} {
        padding: 10px;
        margin-bottom: 0;
    }
    ${Modal.Content} {
        @media (min-width: ${variables.SCREEN_SIZE.SM}) {
            flex-direction: row;
        }
    }
`;

// This modal is opened either in Device (button request) or User (push tx) context
// contexts are distinguished by `type` prop
type ReviewTransactionProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

export const ReviewTransaction = ({ decision }: ReviewTransactionProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const send = useSelector(state => state.wallet.send);
    const fees = useSelector(state => state.wallet.fees);
    const device = useSelector(selectDevice);
    const isActionAbortable = useSelector(selectIsActionAbortable);

    const { cancelSignTx } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
    });

    const [detailsOpen, setDetailsOpen] = useState(false);

    const deviceModel = getDeviceModel(device);

    const { precomposedTx, precomposedForm, signedTx } = send;

    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx || !precomposedForm) {
        return null;
    }

    const { account } = selectedAccount;
    const { networkType } = account;
    const isCardano = isCardanoTx(account, precomposedTx);
    const isEthereum = networkType === 'ethereum';
    const isRbfAction = !!precomposedTx.prevTxid;
    const decreaseOutputId = precomposedTx.useNativeRbf
        ? precomposedForm.setMaxOutputId
        : undefined;

    const outputs = constructOutputs({
        account,
        decreaseOutputId,
        device,
        precomposedForm,
        precomposedTx,
    });

    // omit other button requests (like passphrase)
    const buttonRequests = device.buttonRequests.filter(
        ({ code }) =>
            code === 'ButtonRequest_ConfirmOutput' ||
            code === 'ButtonRequest_SignTx' ||
            (code === 'ButtonRequest_Other' && (isCardano || isEthereum)), // Cardano and Ethereum are using ButtonRequest_Other
    );

    // NOTE: T1 edge-case
    // while confirming decrease amount 'ButtonRequest_ConfirmOutput' is called twice (confirm decrease address, confirm decrease amount)
    // remove 1 additional element to keep it consistent with TT where this step is swipeable with one button request
    if (
        typeof decreaseOutputId === 'number' &&
        deviceModel === DeviceModel.T1 &&
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

    const buttonRequestsCount = isCardano ? buttonRequests.length - 1 : buttonRequests.length;

    const onCancel =
        isActionAbortable || signedTx
            ? () => {
                  cancelSignTx();
                  decision?.resolve(false);
              }
            : undefined;

    return (
        <StyledModal
            modalPrompt={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={outputs.length + 1}
                    activeStep={signedTx ? outputs.length + 2 : buttonRequestsCount}
                    deviceModel={deviceModel}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={onCancel}
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
                buttonRequestsCount={buttonRequestsCount}
                isRbfAction={isRbfAction}
            />
        </StyledModal>
    );
};
