import { type Account } from '@suite-common/wallet-types';

export const isVerifySupported = (account?: Account) => {
    switch (account?.networkType) {
        case 'bitcoin':
        case 'ethereum':
            return true;
        default:
            return false;
    }
};
