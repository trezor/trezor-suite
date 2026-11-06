import { type FeeInfo } from '@suite-common/wallet-types';

export const getFeeInfoRevision = (feeInfo: FeeInfo | null | undefined) =>
    feeInfo?.levels
        .map(({ baseFeePerGas, blocks, feePerUnit, label, maxFeePerGas, maxPriorityFeePerGas }) =>
            [label, feePerUnit, blocks, maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas].join(
                ':',
            ),
        )
        .join('|') ?? '';
