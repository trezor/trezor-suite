import { AccountType } from '@suite-common/wallet-config';

export const paymentTypeToAccountType: Record<string, AccountType> = {
    p2wpkh: 'normal', // `p2wpkh` (SegWit Native) is mapped to `normal`, because it is currently the default account type of Suite.
    p2pkh: 'legacy',
    p2sh: 'segwit',
    p2tr: 'taproot',
};
