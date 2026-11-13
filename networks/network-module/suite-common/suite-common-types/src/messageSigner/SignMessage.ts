import type { DeviceIdentity } from '@trezor/connect-common';
import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
} from '@trezor/device';
import type { Result } from '@trezor/type-utils';

import type { AccountType } from '../SuiteCommonNetworkConfig';
import type { SignVerifyNotSupportedErrorType } from './signVerifyErrors';

// TODO: Hack: the contract repeats every network's signature formats instead of each network
// owning its own. Remove as https://github.com/trezor/trezor-suite/issues/32472
// progresses.
export type SignatureFormat = 'trezor' | 'electrum' | 'raw' | 'cose';

/**
 * One set of parameters for every network: each network reads the ones it understands.
 */
export type SignMessageParams<TNetworkSymbol extends string> = {
    device: DeviceIdentity;
    symbol: TNetworkSymbol;
    accountIndex: number;
    accountType: AccountType;
    path: string;
    message: string;
    hex: boolean;
    /** One of the network's `getFormats`; missing when it offers none. */
    format?: SignatureFormat;
};

export type SignedMessage = {
    signature: string;
    /** Only for networks that return the public key with the signature. */
    pubKey?: string;
};

/** The network does not sign in the requested format. */
export type SignatureFormatNotSupportedErrorType = {
    type: 'SignatureFormatNotSupported';
    format: string;
};

export const SignatureFormatNotSupportedError = (
    format: string,
): SignatureFormatNotSupportedErrorType => ({ type: 'SignatureFormatNotSupported', format });

/** Everything signing an account's message can fail with. */
export type SignError =
    | DeviceCancelledErrType
    | DeviceErrorType
    | DeviceNotConnectedErrorType
    | SignVerifyNotSupportedErrorType
    | SignatureFormatNotSupportedErrorType;

export type MessageSigning<TNetworkSymbol extends string> = {
    /** The formats the user picks from, the default first; missing for networks with no choice. */
    getFormats?: (symbol: TNetworkSymbol, accountType: AccountType) => readonly SignatureFormat[];
    getDefaultFormat?: (symbol: TNetworkSymbol, accountType: AccountType) => SignatureFormat;
    signMessage: (
        params: SignMessageParams<TNetworkSymbol>,
    ) => Promise<Result<SignedMessage, SignError>>;
};
