import {
    type Account,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { computeBandwidthFeeLevel } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type ComposeTronStakingFeeLevelsParams = {
    account: Account;
    bytes: number;
    amount?: string;
    outputs?: { address: string; amount: string }[];
};

export const composeTronStakingFeeLevels = ({
    account,
    bytes,
    amount = '0',
    outputs,
}: ComposeTronStakingFeeLevelsParams): PrecomposedLevels => {
    const resources = account.networkType === 'tron' ? account.misc.tronResources : undefined;
    const feeLevel = computeBandwidthFeeLevel({
        availableStakedBandwidth: resources?.availableStakedBandwidth ?? 0,
        availableFreeBandwidth: resources?.availableFreeBandwidth ?? 0,
        bytes,
    });
    const fee = feeLevel.feePerTx || '0';
    const transactionOutputs = outputs ?? [{ address: account.descriptor, amount }];
    const transaction: PrecomposedTransactionFinal = {
        type: 'final',
        totalSpent: new BigNumber(amount).plus(fee).toString(),
        fee,
        feePerByte: feeLevel.feePerUnit ?? '0',
        bytes,
        inputs: [],
        outputs: transactionOutputs,
        outputsPermutation: transactionOutputs.map((_, index) => index),
    };

    // Rewards and withdrawn principal are credited only after bandwidth has been paid.
    if (new BigNumber(account.availableBalance).lt(fee)) {
        return {
            normal: {
                type: 'error',
                error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                estimatedTransaction: transaction,
            },
        };
    }

    return { normal: transaction };
};
