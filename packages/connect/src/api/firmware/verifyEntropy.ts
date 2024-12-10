import { entropyToMnemonic, mnemonicToSeed } from '@scure/bip39';
import { hmac } from '@noble/hashes/hmac';
import { crypto } from '@noble/hashes/crypto';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';

import { bip39 } from '@trezor/crypto-utils';
import { bip32 } from '@trezor/utxo-lib';

import { PROTO } from '../../constants';

export const generateEntropy = (len: number) => {
    try {
        return Buffer.from(randomBytes(len));
    } catch {
        throw new Error('generateEntropy: Environment does not support crypto random');
    }
};

// https://github.com/trezor/python-shamir-mnemonic/blob/master/shamir_mnemonic/cipher.py
const BASE_ITERATION_COUNT = 10000;
const ROUND_COUNT = 4;

// https://github.com/trezor/python-shamir-mnemonic/blob/master/shamir_mnemonic/cipher.py
const roundFunction = async (i: number, passphrase: Buffer, e: number, salt: Buffer, r: Buffer) => {
    const data = Buffer.concat([Buffer.from([i]), passphrase]);
    const iterations = Math.floor((BASE_ITERATION_COUNT << e) / ROUND_COUNT);

    // '@noble/hashes/pbkdf2' takes ~ 8sec. in the web build
    // const result = pbkdf2(sha256, data, Buffer.concat([salt, r]), {
    //     c: iterations,
    //     dkLen: r.length,
    // });

    // Nodejs only
    // return crypto.pbkdf2Sync(data, Buffer.concat([salt, r]), iterations, r.length, 'sha256');

    // Nodejs + WebCrypto equivalent
    const { subtle } = crypto as Crypto;
    const key = await subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: Buffer.concat([salt, r]),
            iterations,
        },
        key,
        r.length * 8,
    );

    return Buffer.from(bits);
};

// https://github.com/trezor/python-shamir-mnemonic/blob/master/shamir_mnemonic/cipher.py
const xor = (a: Buffer, b: Buffer) => {
    if (a.length !== b.length) {
        throw new Error('Buffers must be of equal length to XOR.');
    }
    const result = Buffer.alloc(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }

    return result;
};

// https://github.com/trezor/python-shamir-mnemonic/blob/master/shamir_mnemonic/cipher.py
// simplified "decrypt" function
const entropyToSeedSlip39 = async (encryptedSecret: Buffer) => {
    const iterationExponent = 1;
    // const identifier = 0;
    // const extendable = true,
    const passphrase = Buffer.from('', 'utf-8'); // empty passphrase
    const salt = Buffer.alloc(0); // extendable: True => no salt

    const half = Math.floor(encryptedSecret.length / 2);
    let l = encryptedSecret.subarray(0, half);
    let r = encryptedSecret.subarray(half);
    for (let round = ROUND_COUNT - 1; round >= 0; round--) {
        const f = await roundFunction(round, passphrase, iterationExponent, salt, r);
        const rr = xor(l, f);
        l = r;
        r = rr;
    }

    return Buffer.concat([r, l]);
};

const getEntropy = (trezorEntropy: string, hostEntropy: string, strength: number) => {
    const data = Buffer.concat([
        Buffer.from(trezorEntropy, 'hex'),
        Buffer.from(hostEntropy, 'hex'),
    ]);
    const entropy = sha256(data);

    return Buffer.from(entropy.subarray(0, Math.floor(strength / 8)));
};

const computeSeed = (type: VerifyEntropyOptions['type'], secret: Buffer) => {
    const BackupType = PROTO.Enum_BackupType;
    if (
        type &&
        [
            BackupType.Slip39_Basic,
            BackupType.Slip39_Advanced,
            BackupType.Slip39_Single_Extendable,
            BackupType.Slip39_Basic_Extendable,
            BackupType.Slip39_Advanced_Extendable,
        ].includes(type)
    ) {
        // use slip39
        return entropyToSeedSlip39(secret);
    }

    // use bip39
    return mnemonicToSeed(entropyToMnemonic(secret, [...bip39])).then(seed => Buffer.from(seed));
};

const verifyCommitment = (entropy: string, commitment: string) => {
    const hmacDigest = hmac(sha256, Buffer.from(entropy, 'hex'), Buffer.alloc(0));
    if (!Buffer.from(hmacDigest).equals(Buffer.from(commitment, 'hex'))) {
        throw new Error('Invalid entropy commitment');
    }
};

type VerifyEntropyOptions = {
    type?: PROTO.Enum_BackupType; // ResetDevice.backup_type
    strength?: number; // ResetDevice.strength
    commitment?: string; // entropy_commitment received from previous EntropyRequest
    hostEntropy: string; // host_entropy used in previous EntropyAck
    trezorEntropy?: string; // prev_entropy received from current EntropyRequest, after ResetDeviceContinue
    xpubs: Record<string, string>; // <address_n, xpub>
};

export const verifyEntropy = async ({
    type,
    strength,
    trezorEntropy,
    hostEntropy,
    commitment,
    xpubs,
}: VerifyEntropyOptions) => {
    try {
        if (!trezorEntropy || !commitment || !strength || Object.keys(xpubs).length < 1) {
            throw new Error('Missing verifyEntropy data');
        }

        verifyCommitment(trezorEntropy, commitment);
        // compute seed
        const secret = getEntropy(trezorEntropy, hostEntropy, strength);
        const seed = await computeSeed(type, secret);

        // derive xpubs and compare with FW results
        const node = bip32.fromSeed(seed);
        Object.keys(xpubs).forEach(path => {
            const pubKey = node.derivePath(path);
            const xpub = pubKey.neutered().toBase58();
            if (xpub !== xpubs[path]) {
                throw new Error('verifyEntropy xpub mismatch');
            }
        });

        return { success: true as const };
    } catch (error) {
        return { success: false as const, error: error.message };
    }
};
