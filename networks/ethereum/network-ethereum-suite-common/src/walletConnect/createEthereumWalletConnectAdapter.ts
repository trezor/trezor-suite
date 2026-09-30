import {
    type EthereumSignTransaction,
    type EthereumSignTypedData,
    type EthereumSignTypedDataTypes,
    type GetTrezorConnectDep,
    asCoinSymbol,
} from '@trezor/connect-common';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import type {
    WalletConnectAccount,
    WalletConnectAdapter,
    WalletConnectRequestContext,
} from '@trezor/network-module-suite-common-types';
import { BigNumber, isAscii, isHex, throwError } from '@trezor/utils';

import { getNetworkConfig } from '../networkConfig';

export type EthereumWalletConnectAdapterDeps = GetTrezorConnectDep<
    'blockchainEstimateFee' | 'pushTransaction'
>;

export type EthereumWalletConnectAdapter = WalletConnectAdapter<EthereumNetworkSymbol>;

type EthereumAccount = WalletConnectAccount<EthereumNetworkSymbol>;

type EthereumContext = WalletConnectRequestContext<EthereumNetworkSymbol>;

type EthereumTransactionRequest = {
    from: string;
    to?: string | null;
    data?: string;
    gas?: string;
    value?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
};

const methods = [
    'eth_sendTransaction',
    'eth_signTypedData_v4',
    'personal_sign',
    'wallet_switchEthereumChain',
];

// Connect reads these values as hex. EIP-1474 requires the 0x prefix. Reject other formats,
// because Connect signs a decimal value as a different hex value.
const TRANSACTION_QUANTITY_FIELDS = [
    'gas',
    'value',
    'gasPrice',
    'maxFeePerGas',
    'maxPriorityFeePerGas',
] as const;

// Placeholder, the popup replaces it with the estimate from the transaction simulation.
const BACKUP_GAS_LIMIT = '250000';

const sanitizeHex = (value: string) => {
    const hex = value.toLowerCase().startsWith('0x') ? value.substring(2) : value;
    if (hex === '') return '';

    return `0x${hex.length % 2 !== 0 ? `0${hex}` : hex}`;
};

const integerStringToHex = (value: string) => {
    const integer = new BigNumber(value);
    if (!integer.isInteger() || integer.isNegative()) {
        throw new Error(`Value '${value}' is not a non-negative integer`);
    }

    return `0x${integer.toString(16)}`;
};

const getChainIds = (symbol: EthereumNetworkSymbol) => {
    const { chainId } = getNetworkConfig(symbol);

    return chainId ? [`eip155:${chainId}`] : [];
};

type FindAccountParams = {
    accounts: readonly EthereumAccount[];
    address: string;
    chainId?: number;
};

const findAccount = ({ accounts, address, chainId }: FindAccountParams) =>
    accounts.find(
        account =>
            account.descriptor.toLowerCase() === address.toLowerCase() &&
            (!chainId || getNetworkConfig(account.symbol).chainId === chainId),
    ) || throwError('Account not found');

const personalSign = async (context: EthereumContext) => {
    const [message, address] = context.request.params as [string, string];
    const account = findAccount({ accounts: context.accounts, address });
    const messageDecoded = message.startsWith('0x')
        ? Buffer.from(message.slice(2), 'hex').toString('utf8')
        : message;
    const messageHex = isHex(message, { prefix: 'optional', allowEmpty: false })
        ? sanitizeHex(message)
        : Buffer.from(message, 'utf8').toString('hex');
    const isReadable = isAscii(messageDecoded);

    const response = await context.callDevice('ethereumSignMessage', {
        path: account.path,
        message: isReadable ? messageDecoded : messageHex,
        hex: !isReadable,
    });
    if (!response.success) {
        console.error('personal_sign error', response);
        throw new Error('personal_sign error');
    }

    return sanitizeHex(response.payload.signature);
};

const signTypedData = async (context: EthereumContext) => {
    const [address, data] = context.request.params as [string, string];
    const account = findAccount({ accounts: context.accounts, address });

    // EIP-712 hashes for T1B1 are computed by @trezor/connect internally
    // since Connect 10 — pass `data` directly for all device models.
    const payload: EthereumSignTypedData<EthereumSignTypedDataTypes> = {
        path: account.path,
        data: JSON.parse(data),
        metamask_v4_compat: true,
    };

    const response = await context.callDevice('ethereumSignTypedData', payload);
    if (!response.success) {
        console.error('eth_signTypedData_v4 error', response);
        throw new Error('eth_signTypedData_v4 error');
    }

    return sanitizeHex(response.payload.signature);
};

type GetTransactionFeeDeps = EthereumWalletConnectAdapterDeps;

type GetTransactionFeeParams = {
    account: EthereumAccount;
    transaction: EthereumTransactionRequest;
};

type GetTransactionFee = (
    params: GetTransactionFeeParams,
) => Promise<Partial<EthereumTransactionRequest>>;

const createGetTransactionFee =
    (deps: GetTransactionFeeDeps): GetTransactionFee =>
    async ({ account, transaction }) => {
        if (
            transaction.gasPrice ||
            (transaction.maxFeePerGas && transaction.maxPriorityFeePerGas)
        ) {
            return {};
        }

        const feeLevels = await deps.getTrezorConnect().blockchainEstimateFee({
            coin: asCoinSymbol(account.symbol),
            identity: account.identity,
            request: {
                blocks: [2],
                specific: { from: account.descriptor },
            },
        });
        if (!feeLevels.success) {
            throw new Error('eth_sendTransaction cannot estimate fee');
        }

        // Fee levels are decimal strings in wei. Connect reads all values as hex.
        const [feeLevel] = feeLevels.payload.levels;
        const eip1559Fee = feeLevel?.eip1559?.medium;
        // Both values are optional. Use the legacy gas price if one of them is missing.
        if (eip1559Fee?.maxFeePerGas && eip1559Fee.maxPriorityFeePerGas) {
            return {
                maxFeePerGas: integerStringToHex(eip1559Fee.maxFeePerGas),
                maxPriorityFeePerGas: integerStringToHex(eip1559Fee.maxPriorityFeePerGas),
            };
        }
        if (!feeLevel?.feePerUnit) {
            throw new Error('eth_sendTransaction cannot estimate fee');
        }

        return { gasPrice: integerStringToHex(feeLevel.feePerUnit) };
    };

type SendTransactionDeps = EthereumWalletConnectAdapterDeps;

type SendTransaction = (context: EthereumContext) => Promise<string>;

const createSendTransaction = (deps: SendTransactionDeps): SendTransaction => {
    const getTransactionFee = createGetTransactionFee(deps);

    return async context => {
        const chainId = Number(context.request.chainId.replace('eip155:', ''));
        const [transaction] = context.request.params as [EthereumTransactionRequest];
        const account = findAccount({
            accounts: context.accounts,
            address: transaction.from,
            chainId,
        });
        for (const field of TRANSACTION_QUANTITY_FIELDS) {
            const value = transaction[field];
            if (value && !isHex(value, { allowEmpty: false })) {
                throw new Error(`eth_sendTransaction invalid ${field}`);
            }
        }

        const fee = await getTransactionFee({ account, transaction });
        const gas = transaction.gas || integerStringToHex(BACKUP_GAS_LIMIT);
        const nonce = await context.resolveNonce(account);

        const response = await context.callDevice('ethereumSignTransaction', {
            path: account.path,
            // The dApp builds the transaction; Connect validates its shape.
            transaction: {
                ...transaction,
                ...fee,
                gas,
                value: transaction.value || '0x0',
                data: sanitizeHex(transaction.data || ''),
                gasLimit: gas,
                nonce: sanitizeHex(parseInt(nonce, 10).toString(16)),
                chainId,
            } as EthereumSignTransaction['transaction'],
        });
        if (!response.success) {
            console.error('eth_sendTransaction error', response);
            throw new Error('eth_sendTransaction error');
        }

        const { serializedTx } = response.payload;
        const pushResponse = await deps.getTrezorConnect().pushTransaction({
            tx: context.isMevProtectionEnabled
                ? serializedTx
                : { hex: serializedTx, disableAlternativeRPC: true },
            coin: asCoinSymbol(account.symbol),
            identity: account.identity,
        });
        if (!pushResponse.success) {
            console.error('eth_sendTransaction push error', pushResponse);
            throw new Error('eth_sendTransaction push error');
        }

        return pushResponse.payload.txid;
    };
};

export const createEthereumWalletConnectAdapter = (
    deps: EthereumWalletConnectAdapterDeps,
): EthereumWalletConnectAdapter => {
    const sendTransaction = createSendTransaction(deps);

    return {
        namespaceId: 'eip155',
        methods,
        events: ['chainChanged', 'accountsChanged'],
        getChainIds,
        getAccountAddress: account => account.descriptor,
        handleRequest: async context => {
            switch (context.request.method) {
                case 'personal_sign':
                    return await personalSign(context);
                case 'eth_signTypedData_v4':
                    return await signTypedData(context);
                case 'eth_sendTransaction':
                    return await sendTransaction(context);
                case 'wallet_switchEthereumChain': {
                    // Suite has no concept of switching chains, the dApp gets its chain back.
                    const [chain] = context.request.params as [unknown];

                    return chain;
                }
                default:
                    throw new Error(`Unsupported method: ${context.request.method}`);
            }
        },
    };
};
