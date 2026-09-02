import { type JsonRpcScanParams } from '@blockaid/client/resources/evm';
import { type MessageScanParams } from '@blockaid/client/resources/solana/message';
import { type TransactionScanParams as StellarScanParams } from '@blockaid/client/resources/stellar/transaction';
import { base58 } from '@scure/base';

import { U_INT_32 } from '@suite-common/wallet-constants';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

import {
    resolveBlockaidEvmChain,
    resolveBlockaidSolanaChain,
    resolveBlockaidStellarChain,
} from '../chains';

function transformPayloadOfEthereumSignTransaction({
    payload: { transaction },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTransaction'>) {
    const chain = resolveBlockaidEvmChain(transaction.chainId);

    if (!chain) {
        return null;
    }

    return {
        chain,
        data: {
            method: 'eth_sendTransaction',
            params: [
                {
                    from: fromAddress,
                    to: transaction.to || '',
                    value: transaction.value || '0x0',
                    data: transaction.data || '0x',
                    // Ensure a high gas limit to prevent out of gas errors during simulation
                    gas: `0x${U_INT_32.toString(16)}`,
                },
            ],
        },
        account_address: fromAddress,
        metadata: {
            domain: sourceOrigin,
            non_dapp: true,
        },
        options: ['validation', 'simulation', 'gas_estimation'],
        block: 'latest',
        simulate_with_estimated_gas: true,
    } as const satisfies JsonRpcScanParams;
}

function transformPayloadOfEthereumSignTypedData({
    payload: { data },
    fromAddress,
    sourceOrigin,
}: TxSimulationMethod<'ethereumSignTypedData'>) {
    const chain = resolveBlockaidEvmChain(
        data.domain.chainId ? Number(data.domain.chainId) : undefined,
    );

    if (!chain) {
        return null;
    }

    return {
        chain,
        data: {
            method: 'eth_signTypedData_v4',
            params: [fromAddress, JSON.stringify(data)],
        },
        account_address: fromAddress,
        metadata: {
            domain: sourceOrigin,
            non_dapp: true,
        },
        options: ['validation', 'simulation', 'gas_estimation'],
        block: 'latest',
        simulate_with_estimated_gas: true,
    } as const satisfies JsonRpcScanParams;
}

function transformPayloadOfSolanaSignTransaction({
    payload: { serializedTx },
    fromAddress,
    sourceOrigin,
    symbol,
}: TxSimulationMethod<'solanaSignTransaction'>) {
    return {
        chain: resolveBlockaidSolanaChain(symbol),
        account_address: fromAddress,
        // Connect serializes the transaction as hex. `encoding` also governs how the API decodes
        // `account_address`, so base64 here makes it reject the base58 address.
        transactions: [base58.encode(Buffer.from(serializedTx, 'hex'))],
        encoding: 'base58',
        metadata: {
            url: sourceOrigin,
            non_dapp: true,
        },
        options: ['validation', 'simulation'],
    } as const satisfies MessageScanParams;
}

function transformPayloadOfStellarSignTransaction({
    payload,
    fromAddress,
    sourceOrigin,
    symbol,
}: TxSimulationMethod<'stellarSignTransaction'>) {
    // Blockaid scans the signed envelope. Connect also accepts structured operations, which would
    // have to be re-encoded to XDR first — those calls go unsimulated.
    if (!('xdrBase64' in payload)) {
        return null;
    }

    return {
        chain: resolveBlockaidStellarChain(symbol),
        account_address: fromAddress,
        transaction: payload.xdrBase64,
        metadata: {
            type: 'wallet',
            url: sourceOrigin,
            non_dapp: true,
        },
        options: ['validation', 'simulation'],
    } as const satisfies StellarScanParams;
}

/**
 * Transform payload to the format expected by the tx simulation API.
 */
export function getTxSimulationParams(action: TxSimulationAction | null) {
    if (!action) {
        return null;
    }

    switch (action.method) {
        case 'ethereumSignTransaction': {
            const params = transformPayloadOfEthereumSignTransaction(action);

            return params && ({ method: action.method, params } as const);
        }
        case 'ethereumSignTypedData': {
            const params = transformPayloadOfEthereumSignTypedData(action);

            return params && ({ method: action.method, params } as const);
        }
        case 'solanaSignTransaction':
            return {
                method: action.method,
                params: transformPayloadOfSolanaSignTransaction(action),
            } as const;
        case 'stellarSignTransaction': {
            const params = transformPayloadOfStellarSignTransaction(action);

            return params && ({ method: action.method, params } as const);
        }
        default:
            return null;
    }
}

export type GetTxSimulationParams = ReturnType<typeof getTxSimulationParams>;
