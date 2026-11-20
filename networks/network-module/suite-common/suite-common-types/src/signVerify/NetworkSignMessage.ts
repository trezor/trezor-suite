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

export type SignMessageParams<TNetworkSymbol extends string> = {
    device: DeviceIdentity;
    symbol: TNetworkSymbol;
    accountIndex: number;
    accountType: AccountType;
    path: string;
    message: string;
    hex: boolean;
    format?: SignatureFormat;
};

export type SignedMessage = {
    signature: string;
    pubKey?: string;
};

export type SignatureFormatNotSupportedErrorType = {
    type: 'SignatureFormatNotSupported';
    format: string;
};

export const SignatureFormatNotSupportedError = (
    format: string,
): SignatureFormatNotSupportedErrorType => ({ type: 'SignatureFormatNotSupported', format });

export type SignError =
    | DeviceCancelledErrType
    | DeviceErrorType
    | DeviceNotConnectedErrorType
    | SignVerifyNotSupportedErrorType
    | SignatureFormatNotSupportedErrorType;

export type NetworkSignMessage<TNetworkSymbol extends string> = {
    getFormats?: (symbol: TNetworkSymbol, accountType: AccountType) => readonly SignatureFormat[];
    getDefaultFormat?: (symbol: TNetworkSymbol, accountType: AccountType) => SignatureFormat;
    signMessage: (
        params: SignMessageParams<TNetworkSymbol>,
    ) => Promise<Result<SignedMessage, SignError>>;
};
