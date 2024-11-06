import { Static, Type } from '@trezor/schema-utils';

import { PROTO } from '../constants';

type CertPubKeys = Static<typeof CertPubKeys>;
const CertPubKeys = Type.Object({
    rootPubKeys: Type.Array(Type.String()),
    caPubKeys: Type.Array(Type.String()),
});

type ModelPubKeys = Static<typeof ModelPubKeys>;

const ModelsWithKeys = Type.Exclude(
    Type.KeyOfEnum(PROTO.DeviceModelInternal),
    Type.Union([Type.Literal('T1B1'), Type.Literal('T2T1')]),
);

const ModelsWithoutKeys = Type.Extract(
    Type.KeyOfEnum(PROTO.DeviceModelInternal),
    Type.Union([Type.Literal('T1B1'), Type.Literal('T2T1')]),
);

const ModelPubKeys = Type.Intersect([
    Type.Record(
        ModelsWithKeys,
        Type.Intersect([
            CertPubKeys,
            Type.Object({
                debug: Type.Optional(CertPubKeys),
            }),
        ]),
    ),
    Type.Partial(Type.Record(ModelsWithoutKeys, Type.Undefined())),
]);

export type DeviceAuthenticityConfig = Static<typeof DeviceAuthenticityConfig>;
export const DeviceAuthenticityConfig = Type.Intersect([
    ModelPubKeys,
    Type.Object({
        version: Type.Number(),
        timestamp: Type.String(),
    }),
]);
