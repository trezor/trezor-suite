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
import { type Branded } from '@trezor/type-utils';

export type StaticSessionId = `${string}@${string}:${number}`;

// First BIP44 testnet address (44'/1'/0'/0/0). See
// `packages/connect/src/device/workflow/validateState.ts` where it is retrieved.
export type WalletDescriptor = string & Branded<'WalletDescriptor'>;

export const asWalletDescriptor = (value: string) => value as WalletDescriptor;

// Input to `createStaticSessionId`: `walletDescriptor` is a plain string the caller
// is still assembling, unlike the branded one a parse returns.
export type StaticSessionIdParts = {
    walletDescriptor: string;
    deviceId: string;
    instance: number;
};

export type ParsedStaticSessionId = StaticSessionIdParts & {
    walletDescriptor: WalletDescriptor;
};

// Strict non-negative integer: no leading zeros (except "0" itself), no signs,
// no decimals, no exponents — anything `Number.parseInt` would silently truncate.
const isNonNegativeIntegerString = (s: string) => /^(0|[1-9]\d*)$/.test(s);

export const isStaticSessionId = (input: unknown): input is StaticSessionId => {
    if (typeof input !== 'string') return false;
    const at = input.split('@');
    if (at.length !== 2) return false;
    // @ts-expect-error - noUncheckedIndexAccess: at[1] is guaranteed to be a string after length check
    const atSecond: string = at[1];
    const colon = atSecond.split(':');
    if (colon.length !== 2) return false;
    // @ts-expect-error - noUncheckedIndexAccess: at[0] is guaranteed to be a string after length check
    const atFirst: string = at[0];
    // @ts-expect-error - noUncheckedIndexAccess: colon[0] is guaranteed to be a string after length check
    const colonFirst: string = colon[0];
    // @ts-expect-error - noUncheckedIndexAccess: colon[1] is guaranteed to be a string after length check
    const colonSecond: string = colon[1];

    return atFirst.length > 0 && colonFirst.length > 0 && isNonNegativeIntegerString(colonSecond);
};

// The `StaticSessionId` brand already guarantees validity, so a plain `string`
// caller must narrow via `isStaticSessionId` before parsing.
export const parseStaticSessionId = (input: StaticSessionId): ParsedStaticSessionId => {
    const [firstTestnetAddressRaw, restRaw] = input.split('@');
    // @ts-expect-error - noUncheckedIndexAccess: split('@') on a validated StaticSessionId always yields two parts
    const firstTestnetAddress: string = firstTestnetAddressRaw;
    // @ts-expect-error - noUncheckedIndexAccess: split('@') on a validated StaticSessionId always yields two parts
    const rest: string = restRaw;
    const [deviceIdRaw, instanceStrRaw] = rest.split(':');
    // @ts-expect-error - noUncheckedIndexAccess: split(':') on a validated StaticSessionId rest always yields two parts
    const deviceId: string = deviceIdRaw;
    // @ts-expect-error - noUncheckedIndexAccess: split(':') on a validated StaticSessionId rest always yields two parts
    const instanceStr: string = instanceStrRaw;

    return {
        walletDescriptor: asWalletDescriptor(firstTestnetAddress),
        deviceId,
        instance: Number.parseInt(instanceStr, 10),
    };
};

export const createStaticSessionId = (parts: StaticSessionIdParts): StaticSessionId => {
    const result = `${parts.walletDescriptor}@${parts.deviceId}:${parts.instance}`;
    // Round-trip the result through the validator so a malformed `parts` (negative or
    // non-integer instance, empty/separator-bearing segments) cannot mint a branded
    // `StaticSessionId` that `isStaticSessionId` would later reject.
    if (!isStaticSessionId(result)) {
        throw new Error(`Invalid StaticSessionId parts: ${JSON.stringify(parts)}`);
    }

    return result;
};
