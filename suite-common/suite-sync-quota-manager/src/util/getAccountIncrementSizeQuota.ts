import { DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA } from '../constants';

type GetAccountSizeQuotaParams = {
    unspendStorage: number;
};

export const getAccountIncrementSizeQuota = ({ unspendStorage }: GetAccountSizeQuotaParams) => {
    if (unspendStorage < DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA) {
        return unspendStorage;
    }

    return DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA;
};
