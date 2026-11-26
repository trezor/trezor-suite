import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { CoinInfo } from '../../coinInfo';
import { CoinObj } from '../../coinInfo';
import type { CommonParams, Response } from '../../params';
import { DerivationPath } from '../../params';

// Methods resolve a path within their own network family only, so the family is part of the query.
export type GetCoinInfo = Static<typeof GetCoinInfo>;
export const GetCoinInfo = Type.Union([
    CoinObj,
    Type.Object({
        path: DerivationPath,
        networkType: Type.Union([Type.Literal('bitcoin'), Type.Literal('ethereum')]),
    }),
]);

export declare function getCoinInfo(params: CommonParams & GetCoinInfo): Response<CoinInfo>;
