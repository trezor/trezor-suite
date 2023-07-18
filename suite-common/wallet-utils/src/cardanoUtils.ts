import { Network } from '@suite-common/wallet-config';

export const getDerivationType = (accountType: Network['accountType']) => {
    switch (accountType) {
        case 'normal':
            return 1;
        case 'legacy':
            return 2;
        case 'ledger':
            return 0;
        default:
            return 1;
    }
};
