import type {
    AccountInfoBase,
    RpcMainnet,
    RpcSubscriptionsMainnet,
    Signature,
    SolanaRpcSubscriptionsApi,
} from '@solana/kit';
import type { GetTransactionApi, SolanaRpcApiMainnet } from '@solana/rpc-api';
import type {
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    ClusterUrl,
} from '@solana/rpc-types';

import type {
    GetObjectWithKey,
    GetObjectWithoutKey,
    ObjectsOnly,
    Overloads,
} from '@trezor/type-utils';

import type { tokenProgramNames } from '../constants';

export type TokenProgramName = (typeof tokenProgramNames)[number];

export interface SolanaStakingAccount {
    status: string;
    stake?: string;
    rentExemptReserve: string;
    voterPubkey?: string;
    activationEpoch?: number;
}

export type SolanaTokenAccountInfo = {
    address: string;
    mint: string | undefined;
    decimals: number | undefined;
};

type GetTransactionApiOverloads = Overloads<GetTransactionApi['getTransaction']>;
type GetJsonParsedTransactionApiOverloads = {
    [P in keyof GetTransactionApiOverloads]: GetTransactionApiOverloads[P] extends (
        ...args: [
            signature: Signature,
            config: Readonly<{
                encoding: 'jsonParsed';
            }>,
        ]
    ) => infer R
        ? R
        : never;
};

export type ParsedTransactionWithMeta = Pick<
    SolanaValidParsedTxWithMeta,
    'slot' | 'transaction' | 'meta'
> &
    Readonly<{
        blockTime?: SolanaValidParsedTxWithMeta['blockTime'];
        version?: SolanaValidParsedTxWithMeta['version'];
    }>;

export type PartiallyDecodedInstruction = GetObjectWithoutKey<
    SolanaValidParsedTxWithMeta['transaction']['message']['instructions'][number],
    'parsed'
>;

export type ParsedAccountData = ObjectsOnly<AccountInfoWithJsonData['data']>;

export type ParsedInstruction = GetObjectWithKey<
    SolanaValidParsedTxWithMeta['transaction']['message']['instructions'][number],
    'parsed'
>;

export type SolanaValidParsedTxWithMeta = NonNullable<
    ObjectsOnly<GetJsonParsedTransactionApiOverloads[keyof GetTransactionApiOverloads]>
>;
export type AccountInfo<
    TData extends
        | AccountInfoWithBase58EncodedData['data']
        | AccountInfoWithBase64EncodedData['data']
        | AccountInfoWithBase64EncodedZStdCompressedData['data']
        | AccountInfoWithJsonData['data'],
> = AccountInfoBase & Readonly<{ data: TData }>;

export type SolanaAPI = Readonly<{
    clusterUrl: ClusterUrl;
    rpc: RpcMainnet<SolanaRpcApiMainnet>;
    rpcSubscriptions: RpcSubscriptionsMainnet<SolanaRpcSubscriptionsApi>;
}>;
