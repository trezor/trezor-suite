import { type Static, Type } from '@trezor/schema-utils';

const CertPubKeysBlacklist = Type.Object({
    blacklistedCaPubKeys: Type.Array(Type.String()),
});

export type DeviceAuthenticityBlacklistConfig = Static<typeof DeviceAuthenticityBlacklistConfig>;
export const DeviceAuthenticityBlacklistConfig = Type.Intersect([
    CertPubKeysBlacklist,
    Type.Object({
        version: Type.Number(),
        debug: Type.Optional(CertPubKeysBlacklist),
    }),
]);
