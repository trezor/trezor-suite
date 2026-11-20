import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { type ReferralKey, getReferralPublicKey, signWithReferralKey } from './referralKey';

export type ReferralSignedMethod = 'GET' | 'POST';

export type GetReferralSignedMessageParams = {
    method: ReferralSignedMethod;
    path: string;
    body: string;
    timestampSeconds: number;
};

export type GetReferralAuthorizationHeaderParams = GetReferralSignedMessageParams & {
    referralKey: ReferralKey;
};

export const getReferralSignedMessage = ({
    method,
    path,
    body,
    timestampSeconds,
}: GetReferralSignedMessageParams) =>
    `v1\n${method}\n${path}\n${timestampSeconds}\n${bytesToHex(sha256(utf8ToBytes(body)))}`;

/**
 * Identity and signature always go in the header, never in the URL, so they don't end up in
 * access logs.
 */
export const getReferralAuthorizationHeader = ({
    referralKey,
    ...messageParams
}: GetReferralAuthorizationHeaderParams) => {
    const publicKey = getReferralPublicKey(referralKey);
    const signature = signWithReferralKey(
        referralKey,
        utf8ToBytes(getReferralSignedMessage(messageParams)),
    );

    return `Referral v1; pubkey="${publicKey}"; ts="${messageParams.timestampSeconds}"; sig="${signature}"`;
};
