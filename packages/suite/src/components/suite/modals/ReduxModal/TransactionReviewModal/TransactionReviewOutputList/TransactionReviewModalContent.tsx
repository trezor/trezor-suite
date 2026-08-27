import { useMemo } from 'react';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import {
    type SerializedTx,
    selectSendFormReviewButtonRequestsCount,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import {
    constructTransactionReviewOutputsOptional,
    getDecreaseOutputId,
    getStakeType,
    getTxValidityTimeoutInMs,
    isDeviceReviewOnly,
    isRbfBumpFeeTransaction,
    isRbfTransaction,
} from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { ReplaceByFeeFailedOriginalTxConfirmed } from '../../UserContextModal/TxDetailModal/ReplaceByFeeFailedOriginalTxConfirmed';
import { TransactionReviewDetails } from '../TransactionReviewDetails';
import { TransactionReviewOutputList } from './TransactionReviewOutputList';
import { TransactionReviewFollowDevice } from '../TransactionReviewFollowDevice';

type TransactionReviewModalContentProps = {
    account: Account;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    precomposedForm: FormState;
    vaultName?: string;
    availableRewards?: YieldClaimReward[];
    isSending: boolean;
    onTryAgain: (cancel: boolean) => void;
    reviewStep: number;
    serializedTx?: SerializedTx;
    areDetailsVisible: boolean;
    hasTxReviewExpired: boolean;
    isRbfConfirmedError?: boolean;
};

export const TransactionReviewModalContent = ({
    account,
    precomposedTx,
    areDetailsVisible,
    serializedTx,
    reviewStep,
    precomposedForm,
    vaultName,
    availableRewards,
    onTryAgain,
    isSending,
    isRbfConfirmedError,
}: TransactionReviewModalContentProps) => {
    const { symbol, networkType } = account;
    const device = useSelector(selectSelectedDevice);
    const swapSlippage = useSelector(selectTradingExchangeSelectedQuote)?.swapSlippage;

    const createdTxTimestamp = useMemo(
        () => precomposedTx.createdTimestamp ?? 0,
        [precomposedTx.createdTimestamp],
    );

    const deadline = createdTxTimestamp + getTxValidityTimeoutInMs(account?.networkType);

    const isBumpFeeRbfAction =
        precomposedTx !== undefined && isRbfBumpFeeTransaction(precomposedTx);

    const decreaseOutputId = getDecreaseOutputId(precomposedTx, precomposedForm);

    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, symbol, decreaseOutputId),
    );

    const outputs = useMemo(
        () =>
            constructTransactionReviewOutputsOptional({
                account,
                availableRewards,
                decreaseOutputId,
                device,
                precomposedForm,
                precomposedTx,
                vaultName,
                swapSlippage,
            }),
        [
            account,
            availableRewards,
            decreaseOutputId,
            device,
            precomposedForm,
            precomposedTx,
            vaultName,
            swapSlippage,
        ],
    );

    const stakeType = getStakeType(precomposedForm);

    if (areDetailsVisible) {
        return <TransactionReviewDetails tx={precomposedTx} txHash={serializedTx?.tx} />;
    }

    if (isDeviceReviewOnly(precomposedTx)) {
        return <TransactionReviewFollowDevice isSigned={!!serializedTx} />;
    }

    if (isRbfConfirmedError && isRbfTransaction(precomposedTx)) {
        return (
            <ReplaceByFeeFailedOriginalTxConfirmed
                type={precomposedTx.rbfType}
                networkType={networkType}
            />
        );
    }

    return (
        <Column gap={16}>
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
