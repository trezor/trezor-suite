import { useMemo } from 'react';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type SerializedTx,
    selectSendFormReviewButtonRequestsCount,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputsOptional,
    getStakeType,
    getTxValidityTimeoutInMs,
    isRbfBumpFeeTransaction,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

import { TransactionReviewOutputList } from './TransactionReviewOutputList';
import { ExpiredTxValidity } from '../../UserContextModal/TxDetailModal/ExpiredTxValidity';
import { ReplaceByFeeFailedOriginalTxConfirmed } from '../../UserContextModal/TxDetailModal/ReplaceByFeeFailedOriginalTxConfirmed';
import { TransactionReviewDetails } from '../TransactionReviewDetails';
import { hasTxValidityExpired } from '../utils';

type TransactionReviewModalContentProps = {
    account: Account;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    precomposedForm: FormState;
    isSending: boolean;
    onTryAgain: (cancel: boolean) => void;
    reviewStep: number;
    serializedTx?: SerializedTx;
    areDetailsVisible: boolean;
    isRbfConfirmedError?: boolean;
};

export const TransactionReviewModalContent = ({
    account,
    precomposedTx,
    areDetailsVisible,
    serializedTx,
    reviewStep,
    precomposedForm,
    onTryAgain,
    isSending,
    isRbfConfirmedError,
}: TransactionReviewModalContentProps) => {
    const { symbol, networkType } = account;
    const device = useSelector(selectSelectedDevice);

    const createdTxTimestamp = useMemo(
        () => precomposedTx.createdTimestamp ?? 0,
        [precomposedTx.createdTimestamp],
    );

    const deadline = createdTxTimestamp + getTxValidityTimeoutInMs(account?.networkType);
    const isTxExpired = hasTxValidityExpired(deadline);

    const isBumpFeeRbfAction =
        precomposedTx !== undefined && isRbfBumpFeeTransaction(precomposedTx);

    const decreaseOutputId =
        isBumpFeeRbfAction && precomposedTx.useNativeRbf
            ? precomposedForm?.setMaxOutputId
            : undefined;

    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, symbol, decreaseOutputId),
    );

    const outputs = useMemo(
        () =>
            constructTransactionReviewOutputsOptional({
                account,
                decreaseOutputId,
                device,
                precomposedForm,
                precomposedTx,
            }),
        [account, decreaseOutputId, device, precomposedForm, precomposedTx],
    );

    const stakeType = getStakeType(precomposedForm, outputs);

    const shouldCheckTxTimeValidity = useMemo(
        () => account.networkType === 'solana' && createdTxTimestamp !== 0,
        [account.networkType, createdTxTimestamp],
    );

    if (areDetailsVisible) {
        return <TransactionReviewDetails tx={precomposedTx} txHash={serializedTx?.tx} />;
    }

    if (isRbfConfirmedError && isRbfTransaction(precomposedTx)) {
        return (
            <ReplaceByFeeFailedOriginalTxConfirmed
                type={precomposedTx.rbfType}
                networkType={networkType}
            />
        );
    }

    if (shouldCheckTxTimeValidity && isTxExpired && !isSending) {
        return <ExpiredTxValidity symbol={symbol} />;
    }

    return (
        <Column gap={spacings.md}>
            <TransactionReviewOutputList
                account={account}
                precomposedTx={precomposedTx}
                precomposedForm={precomposedForm}
                signedTx={serializedTx}
                outputs={outputs}
                buttonRequestsCount={buttonRequestsCount}
                isRbfAction={isBumpFeeRbfAction}
                reviewStep={reviewStep}
                isSending={isSending}
                stakeType={stakeType || undefined}
                deadline={deadline}
                onTryAgain={onTryAgain}
            />
        </Column>
    );
};
