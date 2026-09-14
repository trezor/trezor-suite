import z from 'zod';

import { UnsignedEvmTransactionForSigningSchema } from '@suite-common/earn-stablecoin-api';
import { type NetworkConfigDeps } from '@suite-common/networks';
import { evmHexString } from '@suite-common/schemas/src/evm';
import {
    getNetwork,
    getNetworksCollection,
    getSupportedNetworks,
} from '@suite-common/wallet-config';
import { type AccountKey, type TxSimulationMethod } from '@suite-common/wallet-types';
import { type EthereumSignTransaction } from '@trezor/connect-common';

const partialAccount = (networkConfigDeps: NetworkConfigDeps) =>
    z.object({
        key: z.string(),
        networkType: z.enum(getNetworksCollection(networkConfigDeps).map(n => n.networkType)),
        symbol: z.enum(getSupportedNetworks(networkConfigDeps)),
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

const stablecoinYieldTxSimulationParams = (networkConfigDeps: NetworkConfigDeps) =>
    z.discriminatedUnion('flow', [
        z.strictObject({
            flow: z.union([
                z.literal('deposit'),
                z.literal('withdraw'),
                z.literal('redeem'),
                z.literal('wrap'),
                z.literal('unwrap'),
            ]),
            account: partialAccount(networkConfigDeps),
            unsignedTx: z.string(),
        }),
        z.strictObject({
            flow: z.literal('claim'),
            account: partialAccount(networkConfigDeps),
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

export type StablecoinYieldTxSimulationParams = z.infer<
    ReturnType<typeof stablecoinYieldTxSimulationParams>
>;

function composeUnsignedEvmTx(
    params: StablecoinYieldTxSimulationParams,
): EthereumSignTransaction['transaction'] {
    switch (params.flow) {
        case 'deposit':
        case 'redeem':
        case 'withdraw':
        case 'wrap':
        case 'unwrap': {
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
    networkConfigDeps: NetworkConfigDeps,
    unknownParams: unknown,
    sourceOrigin: string,
) {
    try {
        const parsedParams =
            stablecoinYieldTxSimulationParams(networkConfigDeps).parse(unknownParams);
        const unsignedTx = composeUnsignedEvmTx(parsedParams);
        const { account } = parsedParams;
        const network = getNetwork(networkConfigDeps, account.symbol);

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
