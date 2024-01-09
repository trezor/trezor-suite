import { decode } from 'bs58';

const BIP32_PAYMENT_TYPES = {
    0x0488b21e: 'p2pkh', // 76067358, xpub
    0x049d7cb2: 'p2sh', // 77429938, ypub
    0x04b24746: 'p2wpkh', // 78792518, zpub
    0x043587cf: 'p2pkh', // 70617039, tpub
    0x044a5262: 'p2sh', // 71979618, upub
    0x045f1cf6: 'p2wpkh', // 73342198, vpub
    0x019da462: 'p2pkh', // 27108450, Ltub
    0x01b26ef6: 'p2sh', // 28471030, Mtub
} as const;

type NetworkSymbol =
    | 'btc'
    | 'ltc'
    | 'eth'
    | 'etc'
    | 'xrp'
    | 'bch'
    | 'btg'
    | 'dash'
    | 'dgb'
    | 'doge'
    | 'nmc'
    | 'vtc'
    | 'zec'
    | 'test'
    | 'regtest'
    | 'tsep'
    | 'tgor'
    | 'thol'
    | 'txrp'
    | 'ada'
    | 'tada'
    | 'sol'
    | 'dsol';

type NetworkType = 'bitcoin' | 'ethereum' | 'ripple' | 'cardano' | 'solana';

type XpubVersion = keyof typeof BIP32_PAYMENT_TYPES;

const getPaymentTypeFromXpub = (xpub: string) => {
    if (xpub.startsWith('tr(')) return 'p2tr';

    const xpubVersion = Buffer.from(decode(xpub)).readUInt32BE();
    return BIP32_PAYMENT_TYPES[xpubVersion as XpubVersion];
};

type AccountType = 'normal' | 'legacy' | 'segwit' | 'taproot';
export type Account = {
    symbol: NetworkSymbol;
    descriptor: string;
    accountType: AccountType;
    networkType: NetworkType;
};

const paymentTypeToAccountType: Record<string, AccountType> = {
    p2wpkh: 'normal',
    p2pkh: 'legacy',
    p2sh: 'segwit',
    p2tr: 'taproot',
};

/**
 * Fixes account type based on payment type. Necessary for accounts created in suite-native version < 24.1.1 which were configuring wrong account type.
 */
export const deriveAccountTypeFromPaymentType = (oldAccounts: Account[]): Account[] =>
    oldAccounts.map(oldAccount => {
        const { descriptor, networkType } = oldAccount;

        if (networkType !== 'bitcoin') return oldAccount;

        const paymentType = getPaymentTypeFromXpub(descriptor);
        const migratedAccountType = paymentTypeToAccountType[paymentType];

        return {
            ...oldAccount,
            accountType: migratedAccountType,
        };
    });
