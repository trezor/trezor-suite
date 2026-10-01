import type { TronContractInput } from '@trezor/connect-common';
import type {
    WalletConnectAdapter,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import type { TronNetworkSymbol } from '@trezor/network-tron/constants';

import { getNetworkConfig } from '../networkConfig';

type TronRawData = {
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit?: number;
    contract: TronContractInput[];
};

// Some dApps wrap the transaction in a `transaction` field (legacy format).
type TronTransaction =
    | { raw_data: TronRawData; transaction?: undefined }
    | { transaction: { raw_data: TronRawData }; raw_data?: undefined };

type SignTransactionParams = { address: string; transaction: TronTransaction };

const methods = ['tron_signTransaction', 'tron_signMessage'];

const signTransaction = async (context: WalletConnectRequestContext<TronNetworkSymbol>) => {
    const { address, transaction } = context.request.params as SignTransactionParams;
    const rawTransaction = transaction.transaction ?? transaction;
    const { raw_data: rawData } = rawTransaction;

    const account = context.accounts.find(a => a.visible && a.descriptor === address);
    if (!account) {
        throw new Error(`Tron account not found: ${address}`);
    }

    const response = await context.callDevice('tronSignTransaction', {
        path: account.path,
        ref_block_bytes: rawData.ref_block_bytes,
        ref_block_hash: rawData.ref_block_hash,
        expiration: rawData.expiration,
        timestamp: rawData.timestamp,
        fee_limit: rawData.fee_limit,
        contract: rawData.contract,
    });
    if (!response.success || !response.payload.signature) {
        console.error('tron_signTransaction error', response);
        throw new Error('Tron signing error');
    }

    return { ...rawTransaction, signature: [response.payload.signature] };
};

export const tronWalletConnectAdapter: WalletConnectAdapter<TronNetworkSymbol> = {
    namespaceId: 'tron',
    methods,
    events: ['accountsChanged'],
    getChainIds: symbol => {
        const { caipId } = getNetworkConfig(symbol);

        return caipId ? [caipId] : [];
    },
    getAccountAddress: account => account.descriptor,
    handleRequest: async context => {
        switch (context.request.method) {
            case 'tron_signTransaction':
                return await signTransaction(context);
            case 'tron_signMessage':
                throw new Error('Tron message signing is not supported');
            default:
                throw new Error(`Unsupported method: ${context.request.method}`);
        }
    },
};
