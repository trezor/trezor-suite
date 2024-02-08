import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../constants';

type CertPubKeys = Static<typeof CertPubKeys>;
const CertPubKeys = Type.Object({
    rootPubKeys: Type.Array(Type.String()),
    caPubKeys: Type.Array(Type.String()),
});

// NOTE: only T2B1 model is required in config, other models should be optional and undefined
type ModelPubKeys = Static<typeof ModelPubKeys>;
const ModelPubKeys = Type.Intersect([
    Type.Record(
        Type.Literal(PROTO.DeviceModelInternal.T2B1),
        Type.Intersect([
            CertPubKeys,
            Type.Object({
                debug: Type.Optional(CertPubKeys),
            }),
        ]),
    ),
    Type.Partial(
        Type.Record(
            Type.Exclude(Type.KeyOfEnum(PROTO.DeviceModelInternal), Type.Literal('T2B1')),
            Type.Undefined(),
        ),
    ),
]);

export type DeviceAuthenticityConfig = Static<typeof DeviceAuthenticityConfig>;
export const DeviceAuthenticityConfig = Type.Intersect([
    ModelPubKeys,
    Type.Object({
        version: Type.Number(),
        timestamp: Type.String(),
    }),
]);

/**
 * How to update this config or check Sentry "Device authenticity invalid!" error? Please read this internal description:
 * https://www.notion.so/satoshilabs/Device-authenticity-check-b8656a0fe3ab4a0d84c61534a73de462?pvs=4
 */
export const deviceAuthenticityConfig: DeviceAuthenticityConfig = {
    version: 1,
    timestamp: '2023-02-08T12:00:00+00:00',
    T2B1: {
        rootPubKeys: [
            '04ca97480ac0d7b1e6efafe518cd433cec2bf8ab9822d76eafd34363b55d63e60380bff20acc75cde03cffcb50ab6f8ce70c878e37ebc58ff7cca0a83b16b15fa5',
        ],
        caPubKeys: [
            '04b12efa295ad825a534b7c0bf276e93ad116434426763fa87bfa8a2f12e726906dcf566813f62eba8f8795f94dba0391c53682809cbbd7e4ba01d960b4f1c68f1',
            '04cb87d4c5d0fd5854e829f4c1b666e49a86c25c88a904c0feb66f1338faed0d7760010d7ea1a6474cbcfe1143bd4b5397a4e8b7fe86899113caecf42a984b0c0f',
            '0450c45878b2c6403a5a16e97a8957dc3ea36919bce9321b357f6e7ebe6257ee54102a2c2fa5cefed1dabc498fc76dc0bcf3c3a8a415eac7cc32e7c18185f25b0d',
            '0454d310d88d55d3044d80fcdbce9a63bf3118545fae71f6eca303272dcc4d25cf775ae3c18ae9f41b2cf29377bc4696fc79c8824a6fd6b9ca5fb6805ed6557aab',
            '04e94bf05586a8e7a3e9aba32662a439be5f378da372219c8ee7cf8b4684dbfbd7ba88ed920c06f9f26deab9077654647738df8cf70898fea1c3aaf2ef086fc578',
            '048c6c104bd7cc59cd5c5717533786a72ab59685bd13937f5542820e90f6ac6945e520e19d1d627a8e81ef5a94ef87de7a6a0d778e7dc9d389db877a5f9b629dd8',
            '0467f8860c56b35985b0f53eb04e9187ccf216e1c08327d71231f5dafe92df5c0f1b4dc8ebdcd2f42d0e20c61c493ba2a67d2c354cb57255b0b7dcf7c2196b8277',
            '049faf57b307013e9fed7564956d4a10938326df2e5d3df0456a0525af5f74ddfb88ba7a37c4c04435ffdca33b4fdf2626afbe65fe5c8fc0c6737de3313b85f229',
            '04e3f9053b38000ef590f9cfb48337ef6ea7b387e00f514481f75ac8870b794e81808ea7e12cf86a7b756acb82148f2373541d21b443b6ba389e02f15348bbabf6',
        ],
        debug: {
            // debug keys are used **only** to validate emulator or dev. firmware
            // use `allowDebugKeys: true` parameter in `authenticateDevice` method
            rootPubKeys: [
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
            caPubKeys: [
                '04ba6084cb9fba7c86d5d5a86108a91d55a27056da4eabbedde88a95e1cae8bce3620889167aaf7f2db166998f950984aa195e868f96e22803c3cd991be31d39e7',
            ],
        },
    },
};
