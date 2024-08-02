import { useState } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, variables } from '@trezor/components';
import { Deferred } from '@trezor/utils';
import {
    DeviceRootState,
    selectDevice,
    selectSendFormDraftByAccountKey,
    selectSendFormReviewButtonRequestsCount,
    selectStakePrecomposedForm,
    StakeState,
} from '@suite-common/wallet-core';
import { FormState, StakeFormState } from '@suite-common/wallet-types';
import { constructTransactionReviewOutputs } from '@suite-common/wallet-utils';
import { SendState } from '@suite-common/wallet-core';
import { useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { getTransactionReviewModalActionText } from 'src/utils/suite/transactionReview';
import { Modal, Translation } from 'src/components/suite';
import { TransactionReviewSummary } from './TransactionReviewSummary';
import { TransactionReviewOutputList } from './TransactionReviewOutputList/TransactionReviewOutputList';
import { TransactionReviewEvmExplanation } from './TransactionReviewEvmExplanation';
import { getTxStakeNameByDataHex } from '@suite-common/suite-utils';

const StyledModal = styled(Modal)`
    ${Modal.Body} {
        padding: 10px;
        margin-bottom: 0;
    }
    ${Modal.Content} {
        @media (min-width: ${variables.SCREEN_SIZE.SM}) {
            flex-flow: row wrap;
        }
    }
`;

const isStakeState = (state: SendState | StakeState): state is StakeState => {
    return 'data' in state;
};

const isStakeForm = (form: FormState | StakeFormState): form is StakeFormState => {
    return 'ethereumStakeType' in form;
};

interface TransactionReviewModalContentProps {
    decision: Deferred<boolean, string | number | undefined> | undefined;
    txInfoState: SendState | StakeState;
    cancelSignTx: () => void;
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
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const deviceModelInternal = device?.features?.internal_model;

    const { account } = selectedAccount;
    const { precomposedTx, serializedTx } = txInfoState;

    const precomposedForm = useSelector(state =>
        isStakeState(txInfoState)
            ? selectStakePrecomposedForm(state)
            : selectSendFormDraftByAccountKey(state, account?.key),
    );

    const decreaseOutputId = precomposedTx?.useNativeRbf
        ? precomposedForm?.setMaxOutputId
        : undefined;

    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, account?.symbol, decreaseOutputId),
    );

    if (!account) {
        return null;
    }

    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx || !precomposedForm) {
        return null;
    }

    const { networkType } = account;
    const isRbfAction = !!precomposedTx.prevTxid;

    const outputs = constructTransactionReviewOutputs({
        account,
        decreaseOutputId,
        device,
        precomposedForm,
        precomposedTx,
    });

    // for bump fee we have to analyze tx data which are in outputs[0]
    const ethereumStakeType = isStakeForm(precomposedForm)
        ? precomposedForm.ethereumStakeType
        : getTxStakeNameByDataHex(outputs[0]?.value);

    // get estimate mining time
    let estimateTime;
    const symbolFees = fees[selectedAccount.account.symbol];
    const matchedFeeLevel = symbolFees.levels.find(
        item => item.feePerUnit === precomposedTx.feePerByte,
    );

    if (networkType === 'bitcoin' && matchedFeeLevel) {
        estimateTime = symbolFees.blockTime * matchedFeeLevel.blocks * 60;
    }

    const onCancel =
        isActionAbortable || serializedTx
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
                    activeStep={serializedTx ? outputs.length + 2 : buttonRequestsCount}
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
                actionText={getTransactionReviewModalActionText({
                    ethereumStakeType,
                    isRbfAction,
                })}
            />
            <TransactionReviewOutputList
                account={selectedAccount.account}
                precomposedForm={precomposedForm}
                precomposedTx={precomposedTx}
                signedTx={serializedTx}
                decision={decision}
                detailsOpen={detailsOpen}
                outputs={outputs}
                buttonRequestsCount={buttonRequestsCount}
                isRbfAction={isRbfAction}
                actionText={getTransactionReviewModalActionText({
                    ethereumStakeType,
                    isRbfAction,
                    isSending,
                })}
                isSending={isSending}
                setIsSending={() => setIsSending(true)}
                ethereumStakeType={ethereumStakeType || undefined}
            />
            <TransactionReviewEvmExplanation account={selectedAccount.account} />
        </StyledModal>
    );
};
