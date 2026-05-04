import {
    DefaultSparkSigner,
    SparkError,
    SparkValidationError,
    getSparkFrost,
} from '@buildonspark/spark-sdk';
import type { SparkSigner } from '@buildonspark/spark-sdk';
import { secp256k1 } from '@noble/curves/secp256k1.js';

import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { deriveSparkMnemonicFromSuiteSyncSecret } from './sparkMnemonic';

export type CreateFakeSparkSignerParams = {
    accountNumber: number;
    trezorSecret: SuiteSyncOwnerSecretHex;
};

export type CreateFakeSparkSigner = (params: CreateFakeSparkSignerParams) => Promise<SparkSigner>;

export type CreateFakeSparkSignerDep = {
    createFakeSparkSigner: CreateFakeSparkSigner;
};

export type ConfirmSparkSignerOperationParams = {
    methodName: string;
    paramsJson: string;
};

export type ConfirmSparkSignerOperation = (
    params: ConfirmSparkSignerOperationParams,
) => Promise<boolean>;

export type ConfirmSparkSignerOperationDep = {
    confirmSparkSignerOperation: ConfirmSparkSignerOperation;
};

export type NotifySparkDeviceWorkParams = {
    methodName: string;
    paramsJson: string;
};

export type NotifySparkDeviceWork = (params: NotifySparkDeviceWorkParams) => void;

export type NotifySparkDeviceWorkDep = {
    notifySparkDeviceWork: NotifySparkDeviceWork;
};

type PrivateKeyMethodName =
    | 'decryptEcies'
    | 'getStaticDepositSecretKey'
    | 'getStaticDepositSigningKey'
    | 'htlcHMAC'
    | 'signFrost'
    | 'signMessageWithIdentityKey'
    | 'signSchnorrWithIdentityKey'
    | 'subtractAndSplitSecretWithProofsGivenDerivations'
    | 'subtractPrivateKeysGivenDerivationPaths'
    | 'subtractSplitAndEncrypt';

const serializeSparkSignerOperationParams = (params: unknown[]) => {
    const seenObjects = new WeakSet<object>();

    return JSON.stringify(params, (_key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }

        if (value instanceof Uint8Array) {
            return Array.from(value);
        }

        if (typeof value === 'object' && value !== null) {
            if (seenObjects.has(value)) {
                return '[Circular]';
            }

            seenObjects.add(value);
        }

        return value;
    });
};

export class FakeSparkSigner implements SparkSigner {
    constructor(
        private readonly deps: ConfirmSparkSignerOperationDep & NotifySparkDeviceWorkDep,
        private readonly sparkSigner: SparkSigner = new DefaultSparkSigner(),
    ) {}

    private privateKeyOperationQueue: Promise<void> = Promise.resolve();

    private identityPublicKey?: Uint8Array;

    private depositSigningPublicKey?: Uint8Array;

    private refreshPublicKeys = async () => {
        [this.identityPublicKey, this.depositSigningPublicKey] = await Promise.all([
            this.sparkSigner.getIdentityPublicKey(),
            this.sparkSigner.getDepositSigningKey(),
        ]);
    };

    private enqueuePrivateKeyOperation = <TReturn>(
        operation: () => Promise<TReturn>,
    ): Promise<TReturn> => {
        const queuedOperation = this.privateKeyOperationQueue.then(operation, operation);

        this.privateKeyOperationQueue = queuedOperation.then(
            () => undefined,
            () => undefined,
        );

        return queuedOperation;
    };

    private runPrivateKeyOperation = <TReturn>(
        methodName: PrivateKeyMethodName,
        params: unknown[],
        operation: () => Promise<TReturn>,
    ): Promise<TReturn> =>
        this.enqueuePrivateKeyOperation(async () => {
            try {
                const isConfirmed = await this.deps.confirmSparkSignerOperation({
                    methodName,
                    paramsJson: serializeSparkSignerOperationParams(params),
                });

                if (!isConfirmed) {
                    throw new Error(`FakeSparkSigner.${methodName} cancelled by user`);
                }

                return await operation();
            } catch (error) {
                console.error(`FakeSparkSigner.${methodName} failed`, error);

                throw error;
            }
        });

    private runNotifiedDeviceWorkOperation = <TReturn>(
        methodName: string,
        params: unknown[],
        operation: () => Promise<TReturn>,
    ): Promise<TReturn> => {
        const paramsJson = serializeSparkSignerOperationParams(params);

        this.deps.notifySparkDeviceWork({
            methodName,
            paramsJson,
        });

        return this.enqueuePrivateKeyOperation(async () => {
            try {
                return await operation();
            } catch (error) {
                console.error(`FakeSparkSigner.${methodName} failed`, error);

                throw error;
            }
        });
    };

    // This initializes the signer from the Suite Sync owner secret and derives
    // the Spark wallet keys. It must stay inside the signer because it is the
    // point where secret material becomes Spark private keys.
    init = async ({ accountNumber, trezorSecret }: CreateFakeSparkSignerParams): Promise<void> => {
        try {
            const sparkMnemonic = deriveSparkMnemonicFromSuiteSyncSecret(trezorSecret);

            if (!sparkMnemonic.success) {
                throw new Error(sparkMnemonic.error.type);
            }

            const sparkSeed = await this.sparkSigner.mnemonicToSeed(sparkMnemonic.payload);

            await this.createSparkWalletFromSeed(sparkSeed, accountNumber);
        } catch (error) {
            console.error('FakeSparkSigner.init failed', error);

            throw error;
        }
    };

    // This returns the cached identity public key without delegating to the
    // SDK signer. It matches the SDK error semantics while avoiding access to
    // private key state after initialization.
    getIdentityPublicKey: SparkSigner['getIdentityPublicKey'] = () => {
        if (!this.identityPublicKey) {
            throw new SparkValidationError('Private key is not set', { field: 'identityKey' });
        }

        return Promise.resolve(this.identityPublicKey);
    };

    // This returns the cached deposit public key without delegating to the SDK
    // signer. It matches the SDK error semantics while avoiding access to
    // private key state after initialization.
    getDepositSigningKey: SparkSigner['getDepositSigningKey'] = () => {
        if (!this.depositSigningPublicKey) {
            throw new SparkValidationError('Deposit key is not set', { field: 'depositKey' });
        }

        return Promise.resolve(this.depositSigningPublicKey);
    };

    // This builds the aggregate FROST payload exactly like the SDK does. It is
    // pure parameter reshaping and does not require private key access.
    private buildAggregateFrostParams = ({
        message,
        publicKey,
        verifyingKey,
        selfCommitment,
        statechainCommitments,
        adaptorPubKey,
        selfSignature,
        statechainSignatures,
        statechainPublicKeys,
    }: Parameters<SparkSigner['aggregateFrost']>[0]) => ({
        message,
        statechainSignatures,
        statechainPublicKeys,
        verifyingKey,
        statechainCommitments,
        selfCommitment: selfCommitment.commitment,
        selfPublicKey: publicKey,
        selfSignature,
        adaptorPubKey,
    });

    // This performs aggregate FROST assembly exactly like the SDK. It only
    // combines already-produced public and partial-signature inputs.
    aggregateFrost: SparkSigner['aggregateFrost'] = params => {
        const aggregateFrostParams = this.buildAggregateFrostParams(params);

        return getSparkFrost().aggregateFrost(aggregateFrostParams);
    };

    // This splits a provided secret into shares exactly like the SDK. The fake
    // signer only receives the already-derived secret value here.
    splitSecretWithProofs: SparkSigner['splitSecretWithProofs'] = ({
        secret,
        curveOrder,
        threshold,
        numShares,
    }) => {
        void curveOrder;

        return getSparkFrost().splitSecretWithProofs(secret, threshold, numShares);
    };

    // This verifies an identity signature using only the cached public key.
    // It matches the SDK error type and message exactly.
    validateMessageWithIdentityKey: SparkSigner['validateMessageWithIdentityKey'] = (
        message,
        signature,
    ) => {
        if (!this.identityPublicKey) {
            throw new SparkError('identityKey not initialized');
        }

        return Promise.resolve(secp256k1.verify(signature, message, this.identityPublicKey));
    };

    // This returns the nonce bound to a previously created commitment. The
    // nonce is secret signing material, so the map remains owned by the SDK
    // signer.
    getNonceForSelfCommitment: SparkSigner['getNonceForSelfCommitment'] = selfCommitment =>
        this.sparkSigner.getNonceForSelfCommitment(selfCommitment);

    // This derives the static deposit public key for a given index. Even though
    // it returns a public key, the derivation depends on device-held secret
    // tree and should stay on the device.
    getStaticDepositSigningKey: SparkSigner['getStaticDepositSigningKey'] = idx =>
        this.runPrivateKeyOperation('getStaticDepositSigningKey', [idx], () =>
            this.sparkSigner.getStaticDepositSigningKey(idx),
        );

    // This returns the raw static deposit secret key for a given index. It is
    // direct private key material and must never leave the device in a real
    // hardware-backed implementation.
    getStaticDepositSecretKey: SparkSigner['getStaticDepositSecretKey'] = idx =>
        this.runPrivateKeyOperation('getStaticDepositSecretKey', [idx], () =>
            this.sparkSigner.getStaticDepositSecretKey(idx),
        );

    // This creates a new mnemonic. It does not use the current private key, but
    // it creates fresh secret material and therefore belongs in the secure side.
    generateMnemonic: SparkSigner['generateMnemonic'] = () => this.sparkSigner.generateMnemonic();

    // This converts a mnemonic into a seed. It handles wallet secret material,
    // so it should stay inside the signer or device boundary.
    mnemonicToSeed: SparkSigner['mnemonicToSeed'] = mnemonic =>
        this.sparkSigner.mnemonicToSeed(mnemonic);

    // This signs an arbitrary message with the identity private key. It must
    // stay on the device because producing the signature requires the identity
    // private key.
    signSchnorrWithIdentityKey: SparkSigner['signSchnorrWithIdentityKey'] = message =>
        this.runPrivateKeyOperation('signSchnorrWithIdentityKey', [message], () =>
            this.sparkSigner.signSchnorrWithIdentityKey(message),
        );

    // This produces the local FROST signature share for Spark signing flows.
    // It requires the derived signing private key and the secret nonce, so it
    // must stay on the device.
    signFrost: SparkSigner['signFrost'] = params =>
        this.runPrivateKeyOperation('signFrost', [params], () =>
            this.sparkSigner.signFrost(params),
        );

    // This decrypts ECIES ciphertext intended for the wallet. It uses secret
    // key material internally, so it must stay on the device.
    decryptEcies: SparkSigner['decryptEcies'] = ciphertext =>
        this.runPrivateKeyOperation('decryptEcies', [ciphertext], () =>
            this.sparkSigner.decryptEcies(ciphertext),
        );

    // This creates a fresh secret signing nonce and exposes only the public
    // commitment. Nonce generation is signing-sensitive and should stay on the
    // device to avoid nonce reuse or leakage.
    getRandomSigningCommitment: SparkSigner['getRandomSigningCommitment'] = () =>
        this.sparkSigner.getRandomSigningCommitment();

    // This derives the whole Spark wallet from seed material. It is the core
    // wallet secret expansion step and must stay on the device.
    createSparkWalletFromSeed: SparkSigner['createSparkWalletFromSeed'] = (seed, accountNumber) =>
        this.runNotifiedDeviceWorkOperation(
            'createSparkWalletFromSeed',
            [seed, accountNumber],
            async () => {
                const identityPublicKey = await this.sparkSigner.createSparkWalletFromSeed(
                    seed,
                    accountNumber,
                );

                await this.refreshPublicKeys();

                return identityPublicKey;
            },
        );

    // This derives a public key for a Spark derivation path. It still runs on
    // the device-backed signer, but returning a public key does not require an
    // explicit user confirmation or any direct user interaction.
    getPublicKeyFromDerivation: SparkSigner['getPublicKeyFromDerivation'] = keyDerivation =>
        this.runNotifiedDeviceWorkOperation('getPublicKeyFromDerivation', [keyDerivation], () =>
            this.sparkSigner.getPublicKeyFromDerivation(keyDerivation),
        );

    // This performs scalar arithmetic on two derived private keys. It is
    // private-key manipulation and must remain on the device.
    subtractPrivateKeysGivenDerivationPaths: SparkSigner['subtractPrivateKeysGivenDerivationPaths'] =
        (first, second) =>
            this.runPrivateKeyOperation(
                'subtractPrivateKeysGivenDerivationPaths',
                [first, second],
                () => this.sparkSigner.subtractPrivateKeysGivenDerivationPaths(first, second),
            );

    // This derives private keys, subtracts them, and splits the resulting
    // secret into verifiable shares. It directly works with secret scalars and
    // must stay on the device.
    subtractAndSplitSecretWithProofsGivenDerivations: SparkSigner['subtractAndSplitSecretWithProofsGivenDerivations'] =
        params =>
            this.runPrivateKeyOperation(
                'subtractAndSplitSecretWithProofsGivenDerivations',
                [params],
                () => this.sparkSigner.subtractAndSplitSecretWithProofsGivenDerivations(params),
            );

    // This derives private keys, transforms secret material, and encrypts the
    // result for another party. It is secret-key handling and must stay on the
    // device.
    subtractSplitAndEncrypt: SparkSigner['subtractSplitAndEncrypt'] = params =>
        this.runPrivateKeyOperation('subtractSplitAndEncrypt', [params], () =>
            this.sparkSigner.subtractSplitAndEncrypt(params),
        );

    // This signs a message with the identity private key in the format Spark
    // expects for auth and payload signing. It requires the identity private
    // key and must stay on the device.
    signMessageWithIdentityKey: SparkSigner['signMessageWithIdentityKey'] = (message, compact) =>
        this.runPrivateKeyOperation('signMessageWithIdentityKey', [message, compact], () =>
            this.sparkSigner.signMessageWithIdentityKey(message, compact),
        );

    // This signs a Bitcoin transaction input with the matching private key. It
    // is direct transaction signing and must stay on the device. This method
    // remains synchronous because the SDK contract returns void, so it cannot
    // await an async modal confirmation service.
    signTransactionIndex: SparkSigner['signTransactionIndex'] = (tx, index, publicKey) => {
        this.sparkSigner.signTransactionIndex(tx, index, publicKey);
    };

    // This computes the HTLC HMAC from the dedicated secret key. It uses
    // secret key material directly and must stay on the device.
    htlcHMAC: SparkSigner['htlcHMAC'] = transferID =>
        this.runPrivateKeyOperation('htlcHMAC', [transferID], () =>
            this.sparkSigner.htlcHMAC(transferID),
        );
}

export const createFakeSparkSigner =
    (deps: ConfirmSparkSignerOperationDep & NotifySparkDeviceWorkDep): CreateFakeSparkSigner =>
    async params => {
        const fakeSparkSigner = new FakeSparkSigner(deps);

        try {
            await fakeSparkSigner.init(params);
        } catch (error) {
            console.error('createFakeSparkSigner failed', error);

            throw error;
        }

        return fakeSparkSigner;
    };
