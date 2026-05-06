import { type Static, Type } from '@trezor/schema-utils';

import { DeviceAuthenticityBlacklistConfig } from './config/deviceAuthenticityBlacklistConfigTypes';
import { DeviceAuthenticityConfig } from './config/deviceAuthenticityConfigTypes';

export type AuthenticateDeviceParams = Static<typeof AuthenticateDeviceParams>;
export const AuthenticateDeviceParams = Type.Object({
    config: Type.Optional(DeviceAuthenticityConfig),
    blacklistConfig: Type.Optional(DeviceAuthenticityBlacklistConfig),
    allowDebugKeys: Type.Optional(Type.Boolean()),
});
