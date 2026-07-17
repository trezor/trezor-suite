import { type Static, type TUnsafe, Type } from '@trezor/schema-utils';

import { DeviceAuthenticityBlacklistConfig } from './config/deviceAuthenticityBlacklistConfigTypes';
import { DeviceAuthenticityConfig } from './config/deviceAuthenticityConfigTypes';

// [typescript-performace]: Keep these explicit schema aliases to prevent TypeScript from expanding
// the nested inferred types in the emitted declaration.
type DeviceAuthenticityConfigSchema = TUnsafe<Static<typeof DeviceAuthenticityConfig>>;
type DeviceAuthenticityBlacklistConfigSchema = TUnsafe<
    Static<typeof DeviceAuthenticityBlacklistConfig>
>;

const deviceAuthenticityConfigSchema: DeviceAuthenticityConfigSchema = DeviceAuthenticityConfig;
const deviceAuthenticityBlacklistConfigSchema: DeviceAuthenticityBlacklistConfigSchema =
    DeviceAuthenticityBlacklistConfig;

export type AuthenticateDeviceParams = Static<typeof AuthenticateDeviceParams>;
export const AuthenticateDeviceParams = Type.Object({
    config: Type.Optional(deviceAuthenticityConfigSchema),
    blacklistConfig: Type.Optional(deviceAuthenticityBlacklistConfigSchema),
    allowDebugKeys: Type.Optional(Type.Boolean()),
});
