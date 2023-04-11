import { AccountType } from '@suite-common/wallet-config';

export const paymentTypeToAccountType: Record<string, AccountType> = {
    p2pkh: 'legacy',
    p2sh: 'legacySegwit',
    p2wpkh: 'segwit',
    p2tr: 'taproot',
};
