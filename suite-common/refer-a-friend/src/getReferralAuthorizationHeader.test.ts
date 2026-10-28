import { ed25519 } from '@noble/curves/ed25519.js';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

import {
    getReferralAuthorizationHeader,
    getReferralSignedMessage,
} from './getReferralAuthorizationHeader';
import { getReferralKeyFromCipheredValue, getReferralPublicKey } from './referralKey';

// SHA-256 of the empty string and of `{}`.
const EMPTY_BODY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const EMPTY_OBJECT_BODY_HASH = '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a';

const referralKey = getReferralKeyFromCipheredValue(
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
);

const HEADER_PATTERN = /^Referral v1; pubkey="([0-9a-f]{64})"; ts="(\d+)"; sig="([0-9a-f]{128})"$/;

describe(getReferralSignedMessage.name, () => {
    it('hashes an empty body for GET', () => {
        expect(
            getReferralSignedMessage({
                method: 'GET',
                path: '/v1/account',
                body: '',
                timestampSeconds: 1700000000,
            }),
        ).toBe(`v1\nGET\n/v1/account\n1700000000\n${EMPTY_BODY_HASH}`);
    });

    it('hashes the body for POST', () => {
        expect(
            getReferralSignedMessage({
                method: 'POST',
                path: '/v1/account/leave',
                body: '{}',
                timestampSeconds: 1700000000,
            }),
        ).toBe(`v1\nPOST\n/v1/account/leave\n1700000000\n${EMPTY_OBJECT_BODY_HASH}`);
    });
});

describe(getReferralAuthorizationHeader.name, () => {
    it('carries the public key, timestamp and a valid signature of the request', () => {
        const messageParams = {
            method: 'POST',
            path: '/v1/account',
            body: '{}',
            timestampSeconds: 1700000000,
        } as const;

        const header = getReferralAuthorizationHeader({ referralKey, ...messageParams });
        const [, publicKey, timestamp, signature] = header.match(HEADER_PATTERN) ?? [];

        expect(publicKey).toBe(getReferralPublicKey(referralKey));
        expect(timestamp).toBe('1700000000');
        expect(
            ed25519.verify(
                hexToBytes(signature ?? ''),
                utf8ToBytes(getReferralSignedMessage(messageParams)),
                hexToBytes(publicKey ?? ''),
            ),
        ).toBe(true);
    });
});
