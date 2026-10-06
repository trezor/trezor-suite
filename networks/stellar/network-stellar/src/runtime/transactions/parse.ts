import {
    FeeBumpTransaction,
    Networks,
    Transaction,
    TransactionBuilder,
} from '@stellar/stellar-sdk';

export const parseTransactionFromXDR = (xdrBase64: string, isTestnet: boolean) => {
    let parsed;
    try {
        parsed = TransactionBuilder.fromXdr(
            xdrBase64,
            isTestnet ? Networks.TESTNET : Networks.PUBLIC,
        );
    } catch {
        throw new Error('Invalid XDR');
    }

    if (parsed instanceof FeeBumpTransaction) {
        throw new Error('Unsupported envelope type');
    }

    return parsed;
};

export const parseTransactionFromHex = (hex: string, isTestnet: boolean) => {
    const base64EncodedTx = Buffer.from(hex, 'hex').toString('base64');

    return new Transaction(base64EncodedTx, isTestnet ? Networks.TESTNET : Networks.PUBLIC);
};
