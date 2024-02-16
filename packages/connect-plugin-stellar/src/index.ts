import {
    Signer,
    Asset,
    Memo,
    Transaction,
    Keypair,
    MemoText,
    MemoID,
    MemoHash,
    MemoReturn,
} from '@stellar/stellar-sdk';
import BigNumber from 'bignumber.js';

/**
 * Transforms Signer to TrezorConnect.StellarTransaction.Signer
 * @param {Signer} signer
 * @returns { type: 1 | 2 | 3, key: string, weight: number }
 */
const transformSigner = (signer: Signer) => {
    let type = 0;
    let key: string | undefined;
    const { weight } = signer;
    if ('ed25519PublicKey' in signer) {
        const keyPair = Keypair.fromPublicKey(signer.ed25519PublicKey);
        key = keyPair.rawPublicKey().toString('hex');
    }
    if ('preAuthTx' in signer && signer.preAuthTx instanceof Buffer) {
        type = 1;
        key = signer.preAuthTx.toString('hex');
    }
    if ('sha256Hash' in signer && signer.sha256Hash instanceof Buffer) {
        type = 2;
        key = signer.sha256Hash.toString('hex');
    }
    return {
        type,
        key,
        weight,
    };
};

/**
 * Transforms Asset to TrezorConnect.StellarTransaction.Asset
 * @param {Asset} asset
 * @returns { type: 0 | 1 | 2, code: string, issuer?: string }
 */
const transformAsset = (asset: Asset) => {
    if (asset.isNative()) {
        return {
            type: 0,
            code: asset.getCode(),
        };
    }
    return {
        type: asset.getAssetType() === 'credit_alphanum4' ? 1 : 2,
        code: asset.getCode(),
        issuer: asset.getIssuer(),
    };
};

/**
 * Transforms amount from decimals (lumens) to integer (stroop)
 * @param {string} amount
 * @returns {string}
 */
const transformAmount = (amount: number) => new BigNumber(amount).times(10000000).toString();

/**
 * Transforms Memo to TrezorConnect.StellarTransaction.Memo
 * @param {string} type
 * @returns {string}
 */
const transformMemo = (memo: Memo) => {
    switch (memo.type) {
        case MemoText:
            return { type: 1, text: memo.value!.toString('utf-8') };
        case MemoID:
            return { type: 2, id: memo.value!.toString('utf-8') };
        case MemoHash:
            // stringify is not necessary, Buffer is also accepted
            return { type: 3, hash: memo.value!.toString('hex') };
        case MemoReturn:
            // stringify is not necessary, Buffer is also accepted
            return { type: 4, hash: memo.value!.toString('hex') };
        default:
            return { type: 0 };
    }
};

/**
 * Transforms Transaction.timeBounds to TrezorConnect.StellarTransaction.timebounds
 * @param {string} path
 * @param {Transaction.timeBounds} timebounds
 * @returns {minTime: number, maxTime: number}
 */
const transformTimebounds = (timebounds: Transaction['timeBounds']) => {
    if (!timebounds) return undefined;
    // those values are defined in Trezor firmware messages as numbers
    return {
        minTime: Number.parseInt(timebounds.minTime, 10),
        maxTime: Number.parseInt(timebounds.maxTime, 10),
    };
};

/**
 * Transforms Transaction to TrezorConnect.StellarTransaction
 * @param {string} path
 * @param {Transaction} transaction
 * @returns {TrezorConnect.StellarTransaction}
 */
export const transformTransaction = (path: string, transaction: Transaction) => {
    const amounts = [
        'amount',
        'sendMax',
        'destAmount',
        'sendAmount',
        'destMin',
        'startingBalance',
        'limit',
        'buyAmount',
    ];
    const assets = ['asset', 'sendAsset', 'destAsset', 'selling', 'buying', 'line'];

    const operations = transaction.operations.map((o, i) => {
        const operation: any = { ...o };

        // transform Signer
        if (operation.signer) {
            operation.signer = transformSigner(operation.signer);
        }

        // transform asset path
        if (operation.path) {
            operation.path = operation.path.map(transformAsset);
        }

        // transform "price" field to { n: number, d: number }
        if (typeof operation.price === 'string') {
            // @ts-expect-error
            const xdrOperation = transaction.tx.operations()[i];
            operation.price = {
                n: xdrOperation.body().value().price().n(),
                d: xdrOperation.body().value().price().d(),
            };
        }

        // transform amounts
        amounts.forEach(field => {
            if (typeof operation[field] === 'string') {
                operation[field] = transformAmount(operation[field]);
            }
        });

        // transform assets
        assets.forEach(field => {
            if (operation[field]) {
                operation[field] = transformAsset(operation[field]);
            }
        });

        // add missing field
        if (operation.type === 'allowTrust') {
            const allowTrustAsset = new Asset(operation.assetCode, operation.trustor);
            operation.assetType = transformAsset(allowTrustAsset).type;
        }

        if (operation.type === 'manageData' && operation.value) {
            // stringify is not necessary, Buffer is also accepted
            operation.value = operation.value.toString('hex');
        }
        if (operation.type === 'manageBuyOffer') {
            operation.amount = operation.buyAmount;
            delete operation.buyAmount;
        }
        operation.type = o.type;

        return operation;
    });

    return {
        path,
        networkPassphrase: transaction.networkPassphrase,
        transaction: {
            source: transaction.source,
            fee: Number.parseInt(transaction.fee, 10),
            sequence: transaction.sequence,
            memo: transformMemo(transaction.memo),
            timebounds: transformTimebounds(transaction.timeBounds),
            operations,
        },
    };
};

export default transformTransaction;
