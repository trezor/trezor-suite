import { DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA } from '../constants';

type GetAccountIncrementSizeQuotaParams = {
    unspentStorage: number;
};

export const getAccountIncrementSizeQuota = ({
    unspentStorage,
}: GetAccountIncrementSizeQuotaParams) => {
    if (unspentStorage < DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA) {
        return unspentStorage;
    }

    return DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA;
};
