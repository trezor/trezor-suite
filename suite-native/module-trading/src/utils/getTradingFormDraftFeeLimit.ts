import { type NetworkType } from '@suite-common/wallet-config';

type GetTradingFormDraftFeeLimitParams = {
    networkType: NetworkType;
    fee: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
};

export const getTradingFormDraftFeeLimit = ({
    networkType,
    fee,
    feeLimit,
    estimatedFeeLimit,
}: GetTradingFormDraftFeeLimitParams): string => {
    if (networkType === 'tron') {
        return estimatedFeeLimit ?? fee;
    }

    return feeLimit ?? '';
};
