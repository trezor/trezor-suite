import z from 'zod';

import { UnsignedEvmTransactionForSigningSchema } from '@suite-common/earn-stablecoin-api';
import { evmHexString } from '@suite-common/schemas/src/evm';
import {
    getNetwork,
    networkSymbolCollection,
    networksCollection,
} from '@suite-common/wallet-config';
import { type AccountKey, type TxSimulationMethod } from '@suite-common/wallet-types';
import { type EthereumSignTransaction } from '@trezor/connect-common';

const partialAccount = z.object({
    key: z.string(),
    networkType: z.enum(networksCollection.map(n => n.networkType)),
    symbol: z.enum(networkSymbolCollection),
    descriptor: z.string(),
    path: z.string(),
});

const claimUnsignedTxBase = {
    to: evmHexString,
    data: evmHexString,
    chainId: z.number(),
    gasLimit: z.string(),
    nonce: z.union([z.number(), z.string()]).transform(value => value.toString()),
};

const stablecoinYieldTxSimulationParams = z.discriminatedUnion('flow', [
    z.strictObject({
        flow: z.union([z.literal('deposit'), z.literal('withdraw'), z.literal('redeem')]),
        account: partialAccount,
        unsignedTx: z.string(),
    }),
    z.strictObject({
        flow: z.literal('claim'),
        account: partialAccount,
        unsignedTx: z.union([
            z.strictObject({
                ...claimUnsignedTxBase,
                maxFeePerGas: z.string(),
                maxPriorityFeePerGas: z.string(),
            }),
            z.strictObject({
                ...claimUnsignedTxBase,
                gasPrice: z.string(),
            }),
        ]),
    }),
]);

export type StablecoinYieldTxSimulationParams = z.infer<typeof stablecoinYieldTxSimulationParams>;

function composeUnsignedEvmTx(
    params: StablecoinYieldTxSimulationParams,
): EthereumSignTransaction['transaction'] {
    switch (params.flow) {
        case 'deposit':
        case 'redeem':
        case 'withdraw': {
            const {
                to,
                value = '0x0',
                data,
                chainId,
                gasLimit,
                maxFeePerGas = '0x0',
                maxPriorityFeePerGas = '0x0',
                nonce,
            } = UnsignedEvmTransactionForSigningSchema.parse(JSON.parse(params.unsignedTx));

            return {
                to,
                value,
                data,
                chainId,
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas,
                nonce: nonce.toString(),
            };
        }

        case 'claim': {
            const { to, data, chainId, gasLimit, nonce } = params.unsignedTx;
            const feeFields =
                'gasPrice' in params.unsignedTx
                    ? { gasPrice: params.unsignedTx.gasPrice }
                    : {
                          maxFeePerGas: params.unsignedTx.maxFeePerGas,
                          maxPriorityFeePerGas: params.unsignedTx.maxPriorityFeePerGas,
                      };

            return {
                to,
                value: '0x0',
                data,
                chainId,
                gasLimit,
                ...feeFields,
                nonce,
            };
        }
    }
}

export function composeStablecoinYieldTxSimulationAction(
    unknownParams: unknown,
    sourceOrigin: string,
) {
    try {
        const parsedParams = stablecoinYieldTxSimulationParams.parse(unknownParams);
        const unsignedTx = composeUnsignedEvmTx(parsedParams);
        const { account } = parsedParams;
        const network = getNetwork(account.symbol);

        switch (network.networkType) {
            case 'ethereum': {
                return {
                    accountKey: account.key as AccountKey,
                    action: {
                        method: 'ethereumSignTransaction',
                        fromAddress: account.descriptor,
                        sourceOrigin,
                        payload: {
                            path: account.path,
                            transaction: unsignedTx,
                        },
                    } satisfies TxSimulationMethod<'ethereumSignTransaction'>,
                };
            }

            default:
                throw new Error(`Unsupported network type: ${network.networkType}`);
        }
    } catch (error) {
        console.error(error);

        return null;
    }
}
