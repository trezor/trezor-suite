import type { DeviceIdentity } from '@trezor/connect-common';
import type {
    DeviceCancelledErrType,
    DeviceErrorType,
    DeviceNotConnectedErrorType,
} from '@trezor/device';
import type { Result } from '@trezor/type-utils';

import type { SignVerifyNotSupportedErrorType } from './signVerifyErrors';

export type VerifyMessageParams<TNetworkSymbol extends string> = {
    device: DeviceIdentity;
    symbol: TNetworkSymbol;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export type VerifyError =
    | DeviceCancelledErrType
    | DeviceErrorType
    | DeviceNotConnectedErrorType
    | SignVerifyNotSupportedErrorType;

export type NetworkVerifyMessage<TNetworkSymbol extends string> = {
    verifyMessage?: (
        params: VerifyMessageParams<TNetworkSymbol>,
    ) => Promise<Result<void, VerifyError>>;
};
