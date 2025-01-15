import type { types, trezorUtils } from '@fivebinaries/coin-selection';

import { Static, Type } from '@trezor/schema-utils';

import { PROTO } from '../../exports';
import type { AccountUtxo } from '../../exports';
import { DerivationPath, type Params, type Response } from '../params';
import { CardanoCertificatePointer, CardanoCertificate } from './cardano';
import type { CardanoInput, CardanoOutput } from './cardano';
import type {
    PrecomposeResultFinal,
    PrecomposeResultNonFinal,
    PrecomposeResultError,
} from './composeTransaction';

export type PrecomposedTransactionFinalCardano = Omit<
    PrecomposeResultFinal,
    'inputs' | 'outputs' | 'outputsPermutation'
> & {
    deposit?: string;
    ttl?: number;
    inputs: CardanoInput[];
    outputs: CardanoOutput[];
    unsignedTx: {
        body: string;
        hash: string;
    };
};

export type PrecomposedTransactionNonFinalCardano = Omit<PrecomposeResultNonFinal, 'inputs'> & {
    deposit?: string;
};

export type PrecomposedTransactionErrorCardano =
    | PrecomposeResultError
    | {
          type: 'error';
          error: 'UTXO_BALANCE_INSUFFICIENT' | 'UTXO_VALUE_TOO_SMALL';
      };

export type PrecomposedTransactionCardano =
    | PrecomposedTransactionFinalCardano
    | PrecomposedTransactionNonFinalCardano
    | PrecomposedTransactionErrorCardano;

export const AccountAddress = Type.Object(
    {
        address: Type.String(),
        path: Type.String(),
        transfers: Type.Number(),
        balance: Type.Optional(Type.String()),
        sent: Type.Optional(Type.String()),
        received: Type.Optional(Type.String()),
    },
    {
        $id: 'AccountAddress',
    },
);

export type CardanoComposeTransactionParams = {
    account: {
        descriptor: string;
        utxo: AccountUtxo[];
    };
    feeLevels?: { feePerUnit?: string }[];
    outputs?: types.UserOutput[];
    certificates?: CardanoCertificate[];
    withdrawals?: types.Withdrawal[];
    changeAddress: { address: string; path: string };
    addressParameters: Parameters<(typeof trezorUtils)['transformToTrezorOutputs']>[1];
    testnet?: boolean;
};

// Typebox schema for CardanoComposeTransactionParams, used in Explorer
export type CardanoComposeTransactionParamsSchema = Static<
    typeof CardanoComposeTransactionParamsSchema
>;
export const CardanoComposeTransactionParamsSchema = Type.Object({
    account: Type.Object({
        descriptor: Type.String(),
        utxo: Type.Array(
            Type.Object(
                {
                    txid: Type.String(),
                    vout: Type.Number(),
                    amount: Type.String(),
                    blockHeight: Type.Number(),
                    address: Type.String(),
                    path: Type.String(),
                    confirmations: Type.Number(),
                    coinbase: Type.Optional(Type.Boolean()),
                    cardanoSpecific: Type.Optional(
                        Type.Object({
                            unit: Type.String(),
                        }),
                    ),
                },
                { $id: 'AccountUtxo' },
            ),
        ),
    }),
    feeLevels: Type.Optional(
        Type.Array(
            Type.Object({
                feePerUnit: Type.Optional(Type.String()),
            }),
        ),
    ),
    outputs: Type.Optional(
        Type.Array(
            Type.Intersect(
                [
                    Type.Object(
                        {
                            isChange: Type.Optional(Type.Boolean()),
                            assets: Type.Array(
                                Type.Object({
                                    unit: Type.String(),
                                    quantity: Type.String(),
                                }),
                            ),
                        },
                        { $id: 'BaseOutput' },
                    ),
                    Type.Union([
                        Type.Object(
                            {
                                address: Type.String(),
                                amount: Type.String(),
                                setMax: Type.Optional(Type.Literal(false)),
                            },
                            { $id: 'ExternalOutput' },
                        ),
                        Type.Object(
                            {
                                address: Type.Optional(Type.String()),
                                amount: Type.Optional(Type.String()),
                                setMax: Type.Boolean(),
                            },
                            { $id: 'ExternalOutputIncomplete' },
                        ),
                    ]),
                ],
                { $id: 'UserOutput' },
            ),
        ),
    ),
    certificates: Type.Optional(Type.Array(CardanoCertificate)),
    withdrawals: Type.Optional(
        Type.Array(
            Type.Object(
                {
                    stakeAddress: Type.String(),
                    amount: Type.String(),
                },
                { $id: 'Withdrawal' },
            ),
        ),
    ),
    changeAddress: Type.Object({
        address: Type.String(),
        path: Type.String(),
    }),
    addressParameters: Type.Object(
        {
            addressType: PROTO.EnumCardanoAddressType,
            path: DerivationPath,
            stakingPath: Type.Optional(DerivationPath),
            stakingKeyHash: Type.Optional(Type.String()),
            certificatePointer: Type.Optional(CardanoCertificatePointer),
        },
        { $id: 'CardanoAddressParameters' },
    ),
    testnet: Type.Optional(Type.Boolean()),
});

// TS - Assert type of CardanoComposeTransactionParams is compatible with CardanoComposeTransactionParamsSchema
const _params: CardanoComposeTransactionParamsSchema = {} as CardanoComposeTransactionParams;
const _paramsOld: CardanoComposeTransactionParams = {} as CardanoComposeTransactionParamsSchema;
// eslint-disable-next-line
[_params, _paramsOld];

export declare function cardanoComposeTransaction(
    params: Params<CardanoComposeTransactionParams>,
): Response<PrecomposedTransactionCardano[]>;
