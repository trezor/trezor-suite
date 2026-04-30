import z from 'zod';

import { parseUnsignedEvmTransactionForSigning } from '@suite-common/earn-stablecoin-api';
import {
    getNetwork,
    networkSymbolCollection,
    networksCollection,
} from '@suite-common/wallet-config';
import { type AccountKey, type TxSimulationMethod } from '@suite-common/wallet-types';

const supplyTxSimulationParams = z.strictObject({
    account: z.object({
        key: z.string(),
        networkType: z.enum(networksCollection.map(n => n.networkType)),
        symbol: z.enum(networkSymbolCollection),
        descriptor: z.string(),
        path: z.string(),
    }),
    unsignedSupplyTx: z.string(),
});

export type SupplyTxSimulationParams = z.infer<typeof supplyTxSimulationParams>;

export function composeSupplyTxSimmulationAction(unknownParams: unknown) {
    const parsedParams = supplyTxSimulationParams.safeParse(unknownParams);

    if (!parsedParams.success) {
        return null;
    }

    const unsignedSupplyTx = parseUnsignedEvmTransactionForSigning(
        parsedParams.data.unsignedSupplyTx,
    );

    if (!unsignedSupplyTx) {
        return null;
    }

    const { account } = parsedParams.data;
    const network = getNetwork(account.symbol);

    switch (network.networkType) {
        case 'ethereum': {
            return {
                accountKey: account.key as AccountKey,
                action: {
                    method: 'ethereumSignTransaction',
                    fromAddress: account.descriptor,
                    sourceOrigin: globalThis.location.origin,
                    payload: {
                        path: account.path,
                        transaction: {
                            to: unsignedSupplyTx.to,
                            value: '0x0',
                            data: unsignedSupplyTx.data,
                            chainId: unsignedSupplyTx.chainId,
                            gasLimit: unsignedSupplyTx.gasLimit,
                            maxFeePerGas: unsignedSupplyTx.maxFeePerGas ?? '0x0',
                            maxPriorityFeePerGas: unsignedSupplyTx.maxPriorityFeePerGas ?? '0x0',
                            nonce: unsignedSupplyTx.nonce.toString(),
                        },
                    },
                } satisfies TxSimulationMethod<'ethereumSignTransaction'>,
            };
        }

        default:
            return null;
    }
}
