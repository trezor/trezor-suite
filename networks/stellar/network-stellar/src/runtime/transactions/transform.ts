// Former connect-plugin-stellar

import {
    Address,
    Asset,
    Keypair,
    type Memo,
    MemoHash,
    MemoID,
    MemoReturn,
    MemoText,
    type Operation,
    type Signer,
    type Transaction,
    type xdr,
} from '@stellar/stellar-sdk';

import { transformInvokeHostFunctionOperation } from './sorobanTransform';
import { toStroops } from '../../constants';

// The protobuf Soroban enums mirror the Stellar XDR enums, so the XDR discriminant
// (`x.switch().value`) is used directly as the protobuf `type`.

/**
 * Reads an SCAddress (account or contract) into its Stellar string form (G.../C...).
 */
const readScAddress = (address: xdr.ScAddress) => Address.fromScAddress(address).toString();

/**
 * Reads an SCVal from XDR into the protobuf StellarSCVal shape.
 * bytes-typed fields (bytes, string) are hex strings; 64-bit ints are decimal strings.
 */
const readScVal = (val: xdr.ScVal): any => {
    const type = val.switch().value;

    switch (val.switch().name) {
        case 'scvBool':
            return { type, b: val.b() };
        case 'scvVoid':
            return { type };
        case 'scvU32':
            return { type, u32: val.u32() };
        case 'scvI32':
            return { type, i32: val.i32() };
        case 'scvU64':
            return { type, u64: val.u64().toString() };
        case 'scvI64':
            return { type, i64: val.i64().toString() };
        case 'scvTimepoint':
            return { type, timepoint: val.timepoint().toString() };
        case 'scvDuration':
            return { type, duration: val.duration().toString() };
        case 'scvU128': {
            const parts = val.u128();

            return { type, u128: { hi: parts.hi().toString(), lo: parts.lo().toString() } };
        }
        case 'scvI128': {
            const parts = val.i128();

            return { type, i128: { hi: parts.hi().toString(), lo: parts.lo().toString() } };
        }
        case 'scvU256': {
            const parts = val.u256();

            return {
                type,
                u256: {
                    hi_hi: parts.hiHi().toString(),
                    hi_lo: parts.hiLo().toString(),
                    lo_hi: parts.loHi().toString(),
                    lo_lo: parts.loLo().toString(),
                },
            };
        }
        case 'scvI256': {
            const parts = val.i256();

            return {
                type,
                i256: {
                    hi_hi: parts.hiHi().toString(),
                    hi_lo: parts.hiLo().toString(),
                    lo_hi: parts.loHi().toString(),
                    lo_lo: parts.loLo().toString(),
                },
            };
        }
        case 'scvBytes':
            return { type, bytes: val.bytes().toString('hex') };
        case 'scvString':
            // The bytes in an SCString are not necessarily valid UTF-8, so keep them as hex.
            return { type, string: val.str().toString('hex') };
        case 'scvSymbol':
            return { type, symbol: val.sym().toString() };
        case 'scvVec': {
            const vec = val.vec();
            // A null vector is not a valid Soroban value; rejecting it avoids signing bytes
            // that differ from the input XDR (the firmware always encodes the vector as present).
            if (!vec) {
                throw new Error('SCV_VEC with a null vector is not supported');
            }

            return { type, vec: vec.map(readScVal) };
        }
        case 'scvMap': {
            const map = val.map();
            if (!map) {
                throw new Error('SCV_MAP with a null map is not supported');
            }

            return {
                type,
                map: map.map(entry => ({
                    key: readScVal(entry.key()),
                    value: readScVal(entry.val()),
                })),
            };
        }
        case 'scvAddress':
            return { type, address: readScAddress(val.address()) };
        default:
            throw new Error(`Unsupported SCVal type: ${val.switch().name}`);
    }
};

/**
 * Reads InvokeContractArgs (contract address, function name and arguments) from XDR.
 */
const readInvokeContractArgs = (data: xdr.InvokeContractArgs) => ({
    contract_address: readScAddress(data.contractAddress()),
    function_name: data.functionName().toString(),
    args: data.args().map(readScVal),
});

/**
 * Reads a HostFunction from XDR. Only the invoke-contract host function is supported.
 */
const readHostFunction = (hostFunction: xdr.HostFunction) => {
    if (hostFunction.switch().name !== 'hostFunctionTypeInvokeContract') {
        throw new Error(`Unsupported host function type: ${hostFunction.switch().name}`);
    }

    return {
        type: hostFunction.switch().value,
        invoke_contract: readInvokeContractArgs(hostFunction.invokeContract()),
    };
};

/**
 * Reads a SorobanAuthorizedFunction from XDR. Only the contract-fn variant is supported.
 */
const readAuthorizedFunction = (fn: xdr.SorobanAuthorizedFunction) => {
    if (fn.switch().name !== 'sorobanAuthorizedFunctionTypeContractFn') {
        throw new Error(`Unsupported SorobanAuthorizedFunction type: ${fn.switch().name}`);
    }

    return {
        type: fn.switch().value,
        contract_fn: readInvokeContractArgs(fn.contractFn()),
    };
};

/**
 * Reads a SorobanAuthorizedInvocation tree from XDR (recurses into sub-invocations).
 */
const readAuthorizedInvocation = (invocation: xdr.SorobanAuthorizedInvocation): any => ({
    function: readAuthorizedFunction(invocation.function()),
    sub_invocations: invocation.subInvocations().map(readAuthorizedInvocation),
});

/**
 * Reads SorobanAddressCredentials from XDR.
 */
const readAddressCredentials = (credentials: xdr.SorobanAddressCredentials) => ({
    address: readScAddress(credentials.address()),
    // Nonce is a random sint64; keep it as a string to preserve full precision.
    nonce: credentials.nonce().toString(),
    signature_expiration_ledger: credentials.signatureExpirationLedger(),
    signature: readScVal(credentials.signature()),
});

/**
 * Reads SorobanCredentials from XDR. Only source-account and address-v2 credentials are
 * supported; the legacy (to-be-deprecated) address credentials are intentionally rejected.
 */
const readCredentials = (credentials: xdr.SorobanCredentials) => {
    switch (credentials.switch().name) {
        case 'sorobanCredentialsSourceAccount':
            return { type: credentials.switch().value };
        case 'sorobanCredentialsAddressV2':
            return {
                type: credentials.switch().value,
                address_v2: readAddressCredentials(credentials.addressV2()),
            };
        default:
            throw new Error(`Unsupported SorobanCredentials type: ${credentials.switch().name}`);
    }
};

/**
 * Reads a SorobanAuthorizationEntry from XDR.
 */
const readAuthorizationEntry = (entry: xdr.SorobanAuthorizationEntry) => ({
    credentials: readCredentials(entry.credentials()),
    root_invocation: readAuthorizedInvocation(entry.rootInvocation()),
});

/**
 * Transforms an InvokeHostFunction operation into the protobuf-shaped connect operation.
 */
const transformInvokeHostFunction = (op: Operation.InvokeHostFunction) => ({
    type: 'invokeHostFunction',
    source: op.source,
    function: readHostFunction(op.func),
    auth: (op.auth ?? []).map(readAuthorizationEntry),
});

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
 * Reads the Soroban transaction data (footprint and resource limits) the envelope carries. The
 * device commits to it through the signed digest, so it has to be passed along with the operation.
 */
const readSorobanData = (transaction: Transaction) => {
    const envelope = transaction.toEnvelope();
    if (envelope.switch().name !== 'envelopeTypeTx') return undefined;

    const ext = envelope.v1().tx().ext();

    return ext.switch() === 1 ? ext.sorobanData().toXDR('base64') : undefined;
};

/**
 * Transforms Transaction to TrezorConnect.StellarTransaction
 */
export const transformTransaction = (transaction: Transaction) => {
    const sorobanData = readSorobanData(transaction);

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
        // Soroban operations carry XDR structures that need bespoke handling, not the generic
        // asset/amount field processing below.
        if (o.type === 'invokeHostFunction') {
            return transformInvokeHostFunction(o);
        }

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

    // Soroban transactions carry a transaction extension (SorobanTransactionData) that the
    // device signs over; expose it as raw XDR (hex) for the StellarTxExt message. Only the v1
    // envelope (TransactionExt) has it; the legacy v0 envelope never does.
    const ext = transaction.tx.ext();
    const sorobanData =
        'sorobanData' in ext && ext.switch() === 1 ? ext.sorobanData().toXDR('hex') : undefined;

    return {
        source: transaction.source,
        fee: Number.parseInt(transaction.fee, 10),
        sequence: transaction.sequence,
        memo: transformMemo(transaction.memo),
        timebounds: transformTimebounds(transaction.timeBounds),
        operations,
        ...(sorobanData && { sorobanData }),
    };
};
