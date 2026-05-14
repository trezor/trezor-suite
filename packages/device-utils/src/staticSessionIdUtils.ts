// Static session id is a per-instance, per-passphrase identifier of a device's
// authorization state. Format: `{firstTestnetAddress}@{deviceId}:{instance}`.
//
//   firstTestnetAddress  the first BIP44 testnet receive address, derived
//                        from the device's seed (and current passphrase, if any)
//   deviceId             the device's hardware identifier (Features.device_id)
//   instance             the local zero-based instance number used by the host
//                        to disambiguate multiple wallets on the same device
//
// This module is the single source of truth for parsing, validating, and
// formatting that string. Other packages must build on top of these helpers
// rather than re-implementing the split locally.
export type StaticSessionId = `${string}@${string}:${number}`;

export type ParsedStaticSessionId = {
    firstTestnetAddress: string;
    deviceId: string;
    instance: number;
};

// Strict non-negative integer: no leading zeros (except "0" itself), no signs,
// no decimals, no exponents — anything `Number.parseInt` would silently truncate.
const isNonNegativeIntegerString = (s: string) => /^(0|[1-9]\d*)$/.test(s);

export const isStaticSessionId = (input: unknown): input is StaticSessionId => {
    if (typeof input !== 'string') return false;
    const at = input.split('@');
    if (at.length !== 2) return false;
    const colon = at[1].split(':');
    if (colon.length !== 2) return false;

    return at[0].length > 0 && colon[0].length > 0 && isNonNegativeIntegerString(colon[1]);
};

export const parseStaticSessionId = (input: StaticSessionId): ParsedStaticSessionId => {
    const [firstTestnetAddress, rest] = input.split('@');
    const [deviceId, instanceStr] = rest.split(':');

    return {
        firstTestnetAddress,
        deviceId,
        instance: Number.parseInt(instanceStr, 10),
    };
};

export const createStaticSessionId = (parts: ParsedStaticSessionId): StaticSessionId => {
    const result = `${parts.firstTestnetAddress}@${parts.deviceId}:${parts.instance}`;
    // Round-trip the result through the validator so a malformed `parts` (negative or
    // non-integer instance, empty/separator-bearing segments) cannot mint a branded
    // `StaticSessionId` that `isStaticSessionId` would later reject.
    if (!isStaticSessionId(result)) {
        throw new Error(`Invalid StaticSessionId parts: ${JSON.stringify(parts)}`);
    }

    return result;
};
