import { createHash, createVerify } from 'crypto';

import { isDevEnv } from '@suite-common/suite-utils';
import { type PROTO } from '@trezor/connect';

/**
 * Client-side verification of the SLIP-24 payment request signature created by the trade API.
 * Mirrors the digest computation of `PaymentRequestSigner` (trezor-trade-api) and
 * `PaymentRequestVerifier` (trezor-firmware, core/src/apps/common/payment_request.py),
 * so a mismatch is caught before the request is sent to the device for signing.
 *
 * SLIP-0024: https://github.com/satoshilabs/slips/blob/master/slip-0024.md
 */

export type Slip24Output = {
    // Little-endian hex amount of the SLIP-24 byte length for the chain.
    amount: string;
    address: string;
};

const SLIP24_MAGIC = Buffer.from([0x53, 0x4c, 0x00, 0x24]); // "SL" + 0024

const MEMO_TYPE_TEXT = 1;
const MEMO_TYPE_REFUND = 2;
const MEMO_TYPE_COIN_PURCHASE = 3;
const MEMO_TYPE_TEXT_DETAILS = 4;

// Mirrors PaymentRequestVerifier.PUBLIC_KEY hardcoded in trezor-firmware.
const PRODUCTION_PUBLIC_KEY = '02aa9b94b306f1b50c19b4b953b6acdf2d3ac09eca5e5344a2bb2fbf19495d550c';
// nist256p1 public key of m/0h for "all all ... all" seed, used by debug firmware and dev API.
// Its private key is derivable from the public test mnemonic, so it must never be
// trusted in production builds.
const DEBUG_PUBLIC_KEY = '03d9d93f89c6963b94bbd7a5118828e44c1c395915ace84888717f568cb01974c3';

const TRUSTED_PUBLIC_KEYS = isDevEnv
    ? [PRODUCTION_PUBLIC_KEY, DEBUG_PUBLIC_KEY]
    : [PRODUCTION_PUBLIC_KEY];

// ASN.1 SPKI prefix for a compressed P-256 (prime256v1) public key:
// SEQUENCE { SEQUENCE { OID ecPublicKey, OID prime256v1 }, BIT STRING <point> }.
const P256_SPKI_PREFIX = Buffer.from('3039301306072a8648ce3d020106082a8648ce3d030107032200', 'hex');

const publicKeyToPem = (publicKey: Buffer): string => {
    const spki = Buffer.concat([P256_SPKI_PREFIX, publicKey]);

    return `-----BEGIN PUBLIC KEY-----\n${spki.toString('base64')}\n-----END PUBLIC KEY-----`;
};

// The API returns a compact 64-byte r||s signature, `crypto.verify` expects DER encoding.
const compactSignatureToDer = (signature: Buffer): Buffer => {
    if (signature.length !== 64) {
        throw new Error('SLIP-24: Signature must be a compact 64-byte ECDSA signature.');
    }

    const derInteger = (bytes: Buffer): Buffer => {
        // Strip leading zeros, then prefix 0x00 when the most significant bit is set.
        let start = 0;
        while (start < bytes.length - 1 && bytes.readUInt8(start) === 0) {
            start += 1;
        }
        const value = bytes.subarray(start);
        const prefix = value.readUInt8(0) >= 0x80 ? Buffer.from([0]) : Buffer.alloc(0);

        return Buffer.concat([Buffer.from([0x02, value.length + prefix.length]), prefix, value]);
    };

    const r = derInteger(signature.subarray(0, 32));
    const s = derInteger(signature.subarray(32, 64));

    return Buffer.concat([Buffer.from([0x30, r.length + s.length]), r, s]);
};

const writeCompactSize = (n: number): Buffer => {
    if (n < 253) {
        return Buffer.from([n]);
    }
    if (n < 0x10000) {
        const buffer = Buffer.alloc(3);
        buffer.writeUInt8(253, 0);
        buffer.writeUInt16LE(n, 1);

        return buffer;
    }
    if (n < 0x100000000) {
        const buffer = Buffer.alloc(5);
        buffer.writeUInt8(254, 0);
        buffer.writeUInt32LE(n, 1);

        return buffer;
    }

    throw new Error('SLIP-24: Data too long to encode.');
};

const writePrefixed = (data: Buffer): Buffer =>
    Buffer.concat([writeCompactSize(data.length), data]);

const writeUint32Le = (n: number): Buffer => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(n, 0);

    return buffer;
};

const writeMemo = (memo: PROTO.PaymentRequestMemo): Buffer => {
    if (memo.text_memo !== undefined) {
        return Buffer.concat([
            writeUint32Le(MEMO_TYPE_TEXT),
            writePrefixed(Buffer.from(memo.text_memo.text, 'utf-8')),
        ]);
    }
    if (memo.refund_memo !== undefined) {
        return Buffer.concat([
            writeUint32Le(MEMO_TYPE_REFUND),
            writePrefixed(Buffer.from(memo.refund_memo.address, 'utf-8')),
        ]);
    }
    if (memo.coin_purchase_memo !== undefined) {
        return Buffer.concat([
            writeUint32Le(MEMO_TYPE_COIN_PURCHASE),
            writeUint32Le(memo.coin_purchase_memo.coin_type),
            writePrefixed(Buffer.from(memo.coin_purchase_memo.amount, 'utf-8')),
            writePrefixed(Buffer.from(memo.coin_purchase_memo.address, 'utf-8')),
        ]);
    }
    if (memo.text_details_memo !== undefined) {
        return Buffer.concat([
            writeUint32Le(MEMO_TYPE_TEXT_DETAILS),
            writePrefixed(Buffer.from(memo.text_details_memo.title, 'utf-8')),
            writePrefixed(Buffer.from(memo.text_details_memo.text, 'utf-8')),
        ]);
    }

    throw new Error('SLIP-24: Unrecognized memo type in payment request.');
};

type ComputePaymentRequestPayloadProps = {
    paymentRequest: PROTO.PaymentRequest;
    sendSlip44: number;
    outputs: Slip24Output[];
};

// Returns the signed payload, the SLIP-24 digest is its sha256 hash.
// Exported for tests so they can sign the exact payload that verification recomputes.
export const computePaymentRequestPayload = ({
    paymentRequest,
    sendSlip44,
    outputs,
}: ComputePaymentRequestPayloadProps): Buffer => {
    const memos = paymentRequest.memos ?? [];

    if (!paymentRequest.nonce && memos.length > 0) {
        throw new Error('SLIP-24: Missing nonce in payment request.');
    }

    const nonce = Buffer.from(paymentRequest.nonce ?? '', 'hex');

    // Outputs are hashed separately, each as raw little-endian amount bytes plus prefixed address.
    const outputsHash = createHash('sha256')
        .update(
            Buffer.concat(
                outputs.flatMap(output => [
                    Buffer.from(output.amount, 'hex'),
                    writePrefixed(Buffer.from(output.address, 'utf-8')),
                ]),
            ),
        )
        .digest();

    return Buffer.concat([
        SLIP24_MAGIC,
        writePrefixed(nonce),
        writePrefixed(Buffer.from(paymentRequest.recipient_name, 'utf-8')),
        writeCompactSize(memos.length),
        ...memos.map(writeMemo),
        writeUint32Le(sendSlip44),
        outputsHash,
    ]);
};

type ValidatePaymentRequestSignatureProps = ComputePaymentRequestPayloadProps & {
    sentAsset?: { network: string; isToken: boolean };
};

/**
 * Returns false and logs an error when the signature received from the trade API
 * does not match the payment request content passed to TrezorConnect.
 */
export const validatePaymentRequestSignature = ({
    paymentRequest,
    sendSlip44,
    outputs,
    sentAsset,
}: ValidatePaymentRequestSignatureProps): boolean => {
    try {
        const payload = computePaymentRequestPayload({ paymentRequest, sendSlip44, outputs });
        const signature = compactSignatureToDer(Buffer.from(paymentRequest.signature, 'hex'));

        const isValid = TRUSTED_PUBLIC_KEYS.some(publicKey =>
            createVerify('sha256')
                .update(payload)
                .verify({ key: publicKeyToPem(Buffer.from(publicKey, 'hex')) }, signature),
        );

        if (!isValid) {
            console.error(
                'SLIP-24: Payment request signature does not match its content.',
                JSON.stringify(sentAsset),
            );
        }

        return isValid;
    } catch (error) {
        console.error(
            'SLIP-24: Payment request validation failed.',
            JSON.stringify(sentAsset),
            error,
        );

        return false;
    }
};
