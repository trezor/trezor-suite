import { DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA } from '../quotaManagerQuotaSize';

type GetAccountIncrementSizeQuotaParams = {
    unspentStorage: number;
};

export const getAccountIncrementSizeQuota = ({
    unspentStorage,
}: GetAccountIncrementSizeQuotaParams) => {
    if (unspentStorage < DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA) {
        // The returned size is serialized as an UInt32, which rejects negative values.
        return Math.max(unspentStorage, 0);
    }

    return DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA;
};
