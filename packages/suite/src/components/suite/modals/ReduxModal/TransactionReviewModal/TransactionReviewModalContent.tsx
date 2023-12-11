import { useState } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, variables } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/protobuf/lib/messages';
import { Deferred } from '@trezor/utils';
import { selectDevice, StakeState } from '@suite-common/wallet-core';
import { isCardanoTx } from '@suite-common/wallet-utils';
import { SendState } from 'src/reducers/wallet/sendFormReducer';
import { Dispatch, GetState } from 'src/types/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { constructOutputs } from 'src/utils/wallet/reviewTransactionUtils';
import { getTransactionReviewModalActionText } from 'src/utils/suite/transactionReview';
import { Modal, Translation } from 'src/components/suite';
import { TransactionReviewSummary } from './TransactionReviewSummary';
import { TransactionReviewOutputList } from './TransactionReviewOutputList/TransactionReviewOutputList';

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

interface TransactionReviewModalContentProps {
    decision: Deferred<boolean, string | number | undefined> | undefined;
    txInfoState: SendState | StakeState;
    cancelSignTx: () => (dispatch: Dispatch, getState: GetState) => void;
}

export const TransactionReviewModalContent = ({
    decision,
    txInfoState,
    cancelSignTx,
}: TransactionReviewModalContentProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const fees = useSelector(state => state.wallet.fees);
    const device = useSelector(selectDevice);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const dispatch = useDispatch();
    const [detailsOpen, setDetailsOpen] = useState(false);

    const deviceModelInternal = device?.features?.internal_model;

    const { precomposedTx, precomposedForm, signedTx } = txInfoState;

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

    const ethereumStakeType =
        'ethereumStakeType' in precomposedForm ? precomposedForm.ethereumStakeType : null;
    const actionText = getTransactionReviewModalActionText({
        ethereumStakeType,
        isRbfAction,
    });

    // omit other button requests (like passphrase)
    const buttonRequests = device.buttonRequests.filter(
        ({ code }) =>
            code === 'ButtonRequest_ConfirmOutput' ||
            code === 'ButtonRequest_SignTx' ||
            (code === 'ButtonRequest_Other' && (isCardano || isEthereum)), // Cardano and Ethereum are using ButtonRequest_Other
    );

    // NOTE: T1B1 edge-case
    // while confirming decrease amount 'ButtonRequest_ConfirmOutput' is called twice (confirm decrease address, confirm decrease amount)
    // remove 1 additional element to keep it consistent with T2T1 where this step is swipeable with one button request
    if (
        typeof decreaseOutputId === 'number' &&
        deviceModelInternal === DeviceModelInternal.T1B1 &&
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
                  dispatch(cancelSignTx());
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
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={device?.features?.unit_color}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={onCancel}
                />
            }
        >
            <TransactionReviewSummary
                estimateTime={estimateTime}
                tx={precomposedTx}
                account={selectedAccount.account}
                network={selectedAccount.network}
                broadcast={precomposedForm.options.includes('broadcast')}
                detailsOpen={detailsOpen}
                onDetailsClick={() => setDetailsOpen(!detailsOpen)}
                actionText={actionText}
            />
            <TransactionReviewOutputList
                account={selectedAccount.account}
                precomposedForm={precomposedForm}
                precomposedTx={precomposedTx}
                signedTx={signedTx}
                decision={decision}
                detailsOpen={detailsOpen}
                outputs={outputs}
                buttonRequestsCount={buttonRequestsCount}
                isRbfAction={isRbfAction}
                actionText={actionText}
            />
        </StyledModal>
    );
};
