// Former connect-plugin-stellar

import {
    Asset,
    Keypair,
    type Memo,
    MemoHash,
    MemoID,
    MemoReturn,
    MemoText,
    type Signer,
    type Transaction,
} from '@stellar/stellar-sdk';

import { toStroops } from '../../constants';

/**
 * Transforms Signer to TrezorConnect.StellarTransaction.Signer
 */
const transformSigner = (signer: Signer) => {
    const { weight } = signer;

    if ('ed25519PublicKey' in signer) {
        const keyPair = Keypair.fromPublicKey(signer.ed25519PublicKey);
        const key = keyPair.rawPublicKey().toString('hex');

        return { type: 0, key, weight };
    }
    if ('preAuthTx' in signer) {
        const key = Buffer.from(signer.preAuthTx).toString('hex');

        return { type: 1, key, weight };
    }
    if ('sha256Hash' in signer) {
        const key = Buffer.from(signer.sha256Hash).toString('hex');

        return { type: 2, key, weight };
    }

    return { type: 0, key: undefined, weight };
};

/**
 * Transforms Asset to TrezorConnect.StellarTransaction.Asset
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
 * Transforms Memo to TrezorConnect.StellarTransaction.Memo
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
 */
export const transformTransaction = (transaction: Transaction) => {
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

        // stellar-sdk 16 returns null for absent optional setOptions fields; connect expects
        // them undefined (manageData keeps null — there it means removal of the entry)
        if (operation.type === 'setOptions') {
            Object.keys(operation).forEach(field => {
                if (operation[field] === null) {
                    delete operation[field];
                }
            });
        }

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
            const xdrOperationBody = transaction.tx.operations()[i]?.body().value();
            if (xdrOperationBody && 'price' in xdrOperationBody) {
                operation.price = {
                    n: xdrOperationBody.price().n(),
                    d: xdrOperationBody.price().d(),
                };
            }
        }

        // transform amounts
        amounts.forEach(field => {
            if (typeof operation[field] === 'string') {
                operation[field] = toStroops(operation[field]).toString();
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
        source: transaction.source,
        fee: Number.parseInt(transaction.fee, 10),
        sequence: transaction.sequence,
        memo: transformMemo(transaction.memo),
        timebounds: transformTimebounds(transaction.timeBounds),
        operations,
    };
};
