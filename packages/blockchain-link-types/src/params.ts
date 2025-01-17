import { Type, Static } from '@trezor/schema-utils';

export type AccountBalanceHistoryParams = Static<typeof AccountBalanceHistoryParams>;
export const AccountBalanceHistoryParams = Type.Object(
    {
        descriptor: Type.String(),
        from: Type.Optional(Type.Number()),
        to: Type.Optional(Type.Number()),
        currencies: Type.Optional(Type.Array(Type.String())),
        groupBy: Type.Optional(Type.Number()),
    },
    { $id: 'AccountBalanceHistoryParams' },
);

export type GetCurrentFiatRatesParams = Static<typeof GetCurrentFiatRatesParams>;
export const GetCurrentFiatRatesParams = Type.Object(
    {
        currencies: Type.Optional(Type.Array(Type.String())),
        token: Type.Optional(Type.String()),
    },
    { $id: 'GetCurrentFiatRatesParams' },
);

export type GetFiatRatesForTimestampsParams = Static<typeof GetFiatRatesForTimestampsParams>;
export const GetFiatRatesForTimestampsParams = Type.Object(
    {
        timestamps: Type.Array(Type.Number()),
        currencies: Type.Optional(Type.Array(Type.String())),
        token: Type.Optional(Type.String()),
    },
    { $id: 'GetFiatRatesForTimestampsParams' },
);

export type GetFiatRatesTickersListParams = Static<typeof GetFiatRatesTickersListParams>;
export const GetFiatRatesTickersListParams = Type.Object(
    {
        timestamp: Type.Optional(Type.Number()),
        token: Type.Optional(Type.String()),
    },
    { $id: 'GetFiatRatesTickersListParams' },
);

export type EstimateFeeParams = Static<typeof EstimateFeeParams>;
export const EstimateFeeParams = Type.Object(
    {
        blocks: Type.Optional(Type.Array(Type.Number())),
        specific: Type.Optional(
            Type.Object({
                conservative: Type.Optional(Type.Boolean()),
                txsize: Type.Optional(Type.Number()),
                from: Type.Optional(Type.String()),
                to: Type.Optional(Type.String()),
                data: Type.Optional(Type.String()),
                value: Type.Optional(Type.String()),
                isCreatingAccount: Type.Optional(Type.Boolean()),
                newTokenAccountProgramName: Type.Optional(
                    Type.Union([Type.Literal('spl-token'), Type.Literal('spl-token-2022')]),
                ),
            }),
        ),
    },
    { $id: 'EstimateFeeParams' },
);

export type RpcCallParams = Static<typeof RpcCallParams>;
export const RpcCallParams = Type.Object(
    {
        from: Type.String(),
        to: Type.String(),
        data: Type.String(),
    },
    { $id: 'RpcCallParams' },
);

export type AccountInfoParams = Static<typeof AccountInfoParams>;
export const AccountInfoParams = Type.Object(
    {
        descriptor: Type.String(),
        details: Type.Optional(
            Type.Union([
                Type.Literal('basic'),
                Type.Literal('tokens'),
                Type.Literal('tokenBalances'),
                Type.Literal('txids'),
                Type.Literal('txs'),
            ]),
        ),
        tokens: Type.Optional(
            Type.Union([Type.Literal('nonzero'), Type.Literal('used'), Type.Literal('derived')]),
        ),
        page: Type.Optional(Type.Number()),
        pageSize: Type.Optional(Type.Number()),
        from: Type.Optional(Type.Number()),
        to: Type.Optional(Type.Number()),
        contractFilter: Type.Optional(Type.String()),
        gap: Type.Optional(Type.Number()),
        marker: Type.Optional(
            Type.Object({
                ledger: Type.Number(),
                seq: Type.Number(),
            }),
        ),
        tokenAccountsPubKeys: Type.Optional(Type.Array(Type.String())),
    },
    { $id: 'AccountInfoParams' },
);
