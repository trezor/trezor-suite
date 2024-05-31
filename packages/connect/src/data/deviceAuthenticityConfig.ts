import { Static, Type } from '@trezor/schema-utils';
import { PROTO } from '../constants';

type CertPubKeys = Static<typeof CertPubKeys>;
const CertPubKeys = Type.Object({
    rootPubKeys: Type.Array(Type.String()),
    caPubKeys: Type.Array(Type.String()),
});

type ModelPubKeys = Static<typeof ModelPubKeys>;
const ModelPubKeys = Type.Intersect([
    Type.Record(
        Type.Exclude(
            Type.KeyOfEnum(PROTO.DeviceModelInternal),
            Type.Union([Type.Literal('T1B1'), Type.Literal('T2T1')]),
        ),
        Type.Intersect([
            CertPubKeys,
            Type.Object({
                debug: Type.Optional(CertPubKeys),
            }),
        ]),
    ),
    Type.Partial(
        Type.Record(
            Type.Exclude(
                Type.KeyOfEnum(PROTO.DeviceModelInternal),
                Type.Union([Type.Literal('T2B1'), Type.Literal('T3T1')]),
            ),
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
    timestamp: '2024-05-31T12:00:00+00:00',
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
            '04fdbce7dafecc7808c2e047b5ad6b688c9e37529dfefbe96ba8a092895b5e669e93165abac1720f8fd5d607e35f4663cacf9bacd6e90aa97524401af65490f401',
            '04c408e8a873c12256278c360bd7f35533e703b2f65daecf665a4711ebe6297f82ae2bf8ca60ff7261a69939c10a5cf81c17b7c5aac93cbd73136609c00ecd1666',
            '04850fa71163c60bb92b254d9d4a0c664c1ffef9f5d7ea00c4fa4169b0661dc1918bb2d24b2b4d1202701a753552868aaff9514ae81128671e615a96f0ce90a29c',
            '04c99f57eaaca8db0245a46dba5288a4c0b0d6acdd1346feef7770ec6b88d28d6640ee19c3f6d984e8fcfceda11b1e4accefda32b950dcd1785fbd16c2e45493a3',
            '049c288f4de8a239be83955ed260f40c1a4126fb7dc513601dde4cb11f7363d6a259e73cb1bd9283a450ae608d1832c5fd0cbd9526c0285e720fa45494cae981fd',
            '04ac1815177cc1f07700e5f18c05522427413f404bacc987eb1cf9d86f96b9e0cc53ef5941eafd483102eea321205d7dd9271ac2d0fca75a9a43deb824b51f1596',
            '049f91ac8c7dac26fa7eb82ff3fb8c6d24978bbaeed1adb0751342a8c4c88152817d50bd0b4c16d8fb85bf12f46dca0674a398aeecbb3d1a01236cd3eb39d24c55',
            '04c5225b6d8b84401c408ad0a5aa47888e9087451a2ca4440e46efed5765fd2f5bf8f068e1cfea18dddfc5b47b19076ce0a84fbcf7269f9578d9b978679dea4189',
            '04e349de85981f8e7d95ca4b44346924a9df62875971cfc5e21fc042c3a8fb3e1ddfeac139c15fcf3f7968242a418fc80e92c98f5aef39672b13b60d0b2335c84c',
            '04d7ddaf7e17a678bef305950f0f9d74b90553d8502fd02c439f07ac7ea494e9e0519a1c5782bf23be058162e706057d3b241d507f89b9e5518e3696a92128fa6d',
            '0488cf1dbadb18df0a094da837b3eeb0c85489cc21e7c2b94f8f4df207edccfddbb58e428d9a6ce1e42081c38665d134c7ee6f1f524688ce7444bc1d1340a8b1f1',
            '04ff0c6e817d7c00a0912cf1d293e4d3a8c25403dca4e8ced5e7323352e34604725ad67739d1b4bf538a3864e95d8311ebc91d522b1603da94061e82535edced56',
            '0445f15e55a044b1516a7b2cc13dd4e9ea415336f622b9185e4ffc19e2b51627637491195c85f87ac2582ac4a8d89a33983f0700d042fd7e57d55d346f4fbc832c',
            '042b9cede77aa38f1d824ebd5e13129c8c1c163f3ea74b5251e420831ec17329be741b2af96cc6df0c253e4bffdac23f4bb373e53ae1821587ce0ecae476d2b95c',
            '040cea26562b3763dddd741f4428f37cdc931dbd2db9665888505c2be42868ee2d739aed1d0a54c116b889f5d1ff57dae8dcc1e595cf6d69e71853a8053449ab9f',
        ],
        debug: {
            rootPubKeys: [
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
            caPubKeys: [
                '04ba6084cb9fba7c86d5d5a86108a91d55a27056da4eabbedde88a95e1cae8bce3620889167aaf7f2db166998f950984aa195e868f96e22803c3cd991be31d39e7',
            ],
        },
    },
    T3T1: {
        rootPubKeys: [
            '041854b27fb1d9f65abb66828e78c9dc0ca301e66081ab0c6a4d104f9df1cd0ad5a7c75f77a8c092f55cf825d2abaf734f934c9394d5e75f75a5a06a5ee9be93ae',
        ],
        caPubKeys: [
            '045b785b703810363deeadc0faa5a7388d8385f5e4f9170a3c27d3d2506bf9090d5b09044fbad6b906446d8cdb754b65869e8992b26a344e01ecff75844fe5a3d6',
            '046442ece98b1cd13389b6eda3235e2848becc655db564897b2dc0862580f69b29be59dc30f92820f41a7a493b90623e66e1ee8529dbfd60d50aed97b46c4b8f64',
            '0416960078e1d2b44df717ff5445ec76f4247333375982c5ae59b3bc223371f3cf81e7c182fd1ca36c95977070e2ff46f998bff3f00ab0de266edfdd430aea56b8',
        ],
        debug: {
            rootPubKeys: [
                '04e48b69cd7962068d3cca3bcc6b1747ef496c1e28b5529e34ad7295215ea161dbe8fb08ae0479568f9d2cb07630cb3e52f4af0692102da5873559e45e9fa72959',
            ],
            caPubKeys: [
                '04829e8965018feb542e9236c9b2ce08f864a55ed9183d0259564f0e05345b04676a0bef36c59d21d3c24868b5601f0b1193a6bfcf6d814e1cfb79c2256a05e953',
            ],
        },
    },
};
