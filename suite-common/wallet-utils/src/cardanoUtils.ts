import { Network } from '@suite-common/wallet-config';

// NOTE: This was moved from packages/suite/src/utils/wallet/cardanoUtils.ts
// Reason for that is that we need to use it in @suite-common/ package, but we cannot import
// @fivebinaries/coin-selection there, because it will break mobile app bundling.
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
