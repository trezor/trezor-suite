import z from 'zod';

import { UnsignedEvmTransactionForSigningSchema } from '@suite-common/earn-stablecoin-api';
import { evmHexString } from '@suite-common/schemas/src/evm';
import {
    getNetwork,
    getWrappedNativeAddress,
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
        flow: z.union([
            z.literal('deposit'),
            z.literal('withdraw'),
            z.literal('redeem'),
            z.literal('wrap'),
            z.literal('unwrap'),
        ]),
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

const WETH_DEPOSIT_CALLDATA = '0xd0e30db0';
const WETH_WITHDRAW_SELECTOR = '0x2e1a7d4d';
const WETH_WITHDRAW_CALLDATA_LENGTH = 74;

function assertWethUnsignedTx({
    flow,
    account,
    to,
    data,
    value,
    chainId,
}: {
    flow: 'wrap' | 'unwrap';
    account: StablecoinYieldTxSimulationParams['account'];
    to: string;
    data: string;
    value: string;
    chainId: number;
}) {
    const wethAddress = getWrappedNativeAddress(account.symbol);

    if (!wethAddress || to.toLowerCase() !== wethAddress) {
        throw new Error(
            `WETH ${flow} transaction must target the canonical wrapped-native contract.`,
        );
    }

    const network = getNetwork(account.symbol);

    if (chainId !== network.chainId) {
        throw new Error(
            `WETH ${flow} transaction chainId ${chainId} does not match account network chainId ${network.chainId}.`,
        );
    }

    const calldata = data.toLowerCase();

    if (flow === 'wrap') {
        if (calldata !== WETH_DEPOSIT_CALLDATA) {
            throw new Error('WETH wrap transaction must call deposit().');
        }
        if (BigInt(value) === 0n) {
            throw new Error('WETH wrap transaction must carry a non-zero value.');
        }
    } else {
        if (
            !calldata.startsWith(WETH_WITHDRAW_SELECTOR) ||
            calldata.length !== WETH_WITHDRAW_CALLDATA_LENGTH
        ) {
            throw new Error('WETH unwrap transaction must call withdraw(wad).');
        }
        if (BigInt(`0x${calldata.slice(WETH_WITHDRAW_SELECTOR.length)}`) === 0n) {
            throw new Error('WETH unwrap transaction must withdraw a non-zero amount.');
        }
        if (BigInt(value) !== 0n) {
            throw new Error('WETH unwrap transaction must not carry a value.');
        }
    }
}

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

            if (params.flow === 'wrap' || params.flow === 'unwrap') {
                assertWethUnsignedTx({
                    flow: params.flow,
                    account: params.account,
                    to,
                    data,
                    value,
                    chainId,
                });
            }

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
