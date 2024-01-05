import { PROTO } from '../../../constants';
import { DerivationPath } from '../../params';
import { Type, Static } from '@trezor/schema-utils';

// eosGetPublicKey

export type EosPublicKey = Static<typeof EosPublicKey>;
export const EosPublicKey = Type.Object({
    wifPublicKey: Type.String(),
    rawPublicKey: Type.String(),
    path: Type.Array(Type.Number()),
    serializedPath: Type.String(),
});
// eosSignTransaction

export type EosTxHeader = Static<typeof EosTxHeader>;
export const EosTxHeader = Type.Object({
    expiration: Type.Union([Type.Uint(), Type.String()]), // In tests expiration is a ISO date string
    refBlockNum: Type.Number(),
    refBlockPrefix: Type.Number(),
    maxNetUsageWords: Type.Number(),
    maxCpuUsageMs: Type.Number(),
    delaySec: Type.Number(),
});

export type EosAuthorization = Static<typeof EosAuthorization>;
export const EosAuthorization = Type.Object({
    threshold: Type.Number(),
    keys: Type.Array(PROTO.EosAuthorizationKey),
    accounts: Type.Array(
        Type.Object({
            permission: PROTO.EosPermissionLevel,
            weight: Type.Number(),
        }),
    ),
    waits: Type.Array(PROTO.EosAuthorizationWait),
});

export type EosTxActionCommon = Static<typeof EosTxActionCommon>;
export const EosTxActionCommon = Type.Object({
    account: Type.String(),
    authorization: Type.Array(PROTO.EosPermissionLevel),
});

export type EosTxAction = Static<typeof EosTxAction>;
export const EosTxAction = Type.Union([
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('transfer'),
            data: Type.Object({
                from: Type.String(),
                to: Type.String(),
                quantity: Type.String(),
                memo: Type.String(),
            }),
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('delegatebw'),
            data: Type.Object({
                from: Type.String(),
                receiver: Type.String(),
                stake_net_quantity: Type.String(),
                stake_cpu_quantity: Type.String(),
                transfer: Type.Boolean(),
            }),
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('undelegatebw'),
            data: Type.Object({
                from: Type.String(),
                receiver: Type.String(),
                unstake_net_quantity: Type.String(),
                unstake_cpu_quantity: Type.String(),
            }),
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('buyram'),
            data: Type.Object({
                payer: Type.String(),
                receiver: Type.String(),
                quant: Type.String(),
            }),
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('buyrambytes'),
            data: PROTO.EosActionBuyRamBytes,
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('sellram'),
            data: PROTO.EosActionSellRam,
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('voteproducer'),
            data: Type.Object({
                voter: Type.String(),
                proxy: Type.String(),
                producers: Type.Array(Type.String()),
            }),
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('refund'),
            data: PROTO.EosActionRefund,
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('updateauth'),
            data: Type.Object({
                account: Type.String(),
                permission: Type.String(),
                parent: Type.String(),
                auth: EosAuthorization,
            }),
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('deleteauth'),
            data: PROTO.EosActionDeleteAuth,
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('linkauth'),
            data: PROTO.EosActionLinkAuth,
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('unlinkauth'),
            data: PROTO.EosActionUnlinkAuth,
        }),
    ]),
    Type.Intersect([
        EosTxActionCommon,
        Type.Object({
            name: Type.Literal('newaccount'),
            data: Type.Object({
                creator: Type.String(),
                name: Type.String(),
                owner: EosAuthorization,
                active: EosAuthorization,
            }),
        }),
    ]),
]);
// | EosTxActionCommon & {
//     name: string;
//     data: string;
// };

export type EosSDKTransaction = Static<typeof EosSDKTransaction>;
export const EosSDKTransaction = Type.Object({
    chainId: Type.String(),
    header: EosTxHeader,
    actions: Type.Array(
        Type.Union([
            EosTxAction,
            Type.Intersect([
                EosTxActionCommon,
                Type.Object({
                    name: Type.String(),
                    data: Type.String(),
                }),
            ]),
        ]),
    ),
});

export type EosSignTransaction = Static<typeof EosSignTransaction>;
export const EosSignTransaction = Type.Object({
    path: DerivationPath,
    transaction: EosSDKTransaction,
    chunkify: Type.Optional(Type.Boolean()),
});
