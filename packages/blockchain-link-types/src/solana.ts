import type {
    AccountInfoBase,
    AccountInfoWithBase58EncodedData,
    AccountInfoWithBase64EncodedData,
    AccountInfoWithBase64EncodedZStdCompressedData,
    AccountInfoWithJsonData,
    GetTransactionApi,
    Signature,
} from '@solana/web3.js';

import type {
    GetObjectWithKey,
    GetObjectWithoutKey,
    ObjectsOnly,
    Overloads,
} from '@trezor/type-utils';

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

export type SolanaTokenAccountInfo = {
    address: string;
    mint: string | undefined;
    decimals: number | undefined;
};

export type AccountInfo<
    TData extends
        | AccountInfoWithBase58EncodedData['data']
        | AccountInfoWithBase64EncodedData['data']
        | AccountInfoWithBase64EncodedZStdCompressedData['data']
        | AccountInfoWithJsonData['data'],
> = AccountInfoBase & Readonly<{ data: TData }>;

export type { Address } from '@solana/web3.js';

export type TokenDetailByMint = { [mint: string]: { name: string; symbol: string } };
