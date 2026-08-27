const REDACTED = '[redacted]';

// Only JSON-looking blobs are redacted, so that prose such as `[Info] failed` stays readable.
const jsonBlobRegex = /[[{][\s\S]*[\]}]/g;
const jsonBlobContentRegex = /["\d]/;

const bech32Regex = /\b(?:addr_test1|addr1|stake_test1|stake1|bc1|tb1|ltc1)[02-9ac-hj-np-z]{10,}/gi;
const extendedKeyRegex = /\b[xyztuv](?:pub|prv)[1-9A-HJ-NP-Za-km-z]{20,}/g;
const longHexRegex = /\b(?:0x)?[0-9a-f]{40,}\b/gi;
const base58Regex = /\b[1-9A-HJ-NP-Za-km-z]{32,}\b/g;

export const redactSensitiveDataFromString = (text: string) =>
    text
        .replace(jsonBlobRegex, blob => (jsonBlobContentRegex.test(blob) ? REDACTED : blob))
        .replace(extendedKeyRegex, REDACTED)
        .replace(bech32Regex, REDACTED)
        .replace(longHexRegex, REDACTED)
        .replace(base58Regex, REDACTED);
