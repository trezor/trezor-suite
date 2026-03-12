/**
 * MCP (Model Context Protocol) server module for Trezor Suite.
 *
 * Exposes Trezor Connect functionality as MCP tools, allowing AI agents
 * to interact with Trezor hardware wallets. Uses the same connect-popup
 * flow as the WebSocket integration — all operations are forwarded to
 * the renderer for permissions, device management, and UI interactions.
 */
import * as crypto from 'crypto';
import * as http from 'http';

import { CALL_SOURCE_MCP, type ConnectProcessInfo } from '@suite-common/connect-popup';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { convertAmountUnitsToSubunits, substituteBip43Path } from '@suite-common/wallet-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { findProcessFromIncomingPort } from '@trezor/node-utils';

import { addMessage } from '../libs/connect-popup-messages';
import { getProcessIcon } from '../libs/process-icon';
import { ipcMain } from '../typed-electron';
import { type ModuleInit } from './module';

export const SERVICE_NAME = 'mcp-server';

const LOG_PREFIX = 'mcp-server';

const MCP_MANIFEST = {
    appName: 'MCP Agent',
    appUrl: 'http://localhost',
    email: 'mcp@localhost',
};

// Incrementing message ID counter, prefixed to avoid collisions with connect-ws
let messageIdCounter = 0;
const nextMessageId = () => `mcp-${++messageIdCounter}`;

const generateToken = () => crypto.randomBytes(32).toString('hex');

const getNetworkTypeForCoin = (coin: string) => getNetworkOptional(coin.toLowerCase())?.networkType;
const isEvmCoin = (coin: string) => getNetworkTypeForCoin(coin) === 'ethereum';
const isXrpCoin = (coin: string) => getNetworkTypeForCoin(coin) === 'ripple';
const isUtxoCoin = (coin: string) => getNetworkTypeForCoin(coin) === 'bitcoin';

/**
 * Convert a human-readable coin value to the smallest unit as a string.
 */
const coinToSmallestUnit = (value: string, coin: string): string => {
    const decimals = getNetworkOptional(coin)?.decimals ?? 18;

    return convertAmountUnitsToSubunits(value, decimals);
};

/**
 * Convert a numeric string or number to hex string. Passes through existing hex values.
 */
const toHex = (value: string | number): string => {
    if (typeof value === 'string' && value.startsWith('0x')) return value;

    return '0x' + BigInt(value).toString(16);
};

// TODO: Consider generating MCP tool definitions from a shared schema
// with connect-explorer to avoid maintaining duplicate documentation.
/**
 * MCP tool definitions. Each tool maps to a TrezorConnect method
 * and defines the JSON schema for its parameters.
 */
const MCP_TOOLS = [
    {
        name: 'trezor_get_address',
        description:
            'Get a receive address from the Trezor device for a given cryptocurrency. ' +
            'The address can optionally be displayed on the Trezor screen for verification. ' +
            'Supports Bitcoin/UTXO coins via getAddress and all EVM chains (eth, pol, bsc, arb, ' +
            'base, op, avax, etc) via ethereumGetAddress.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description:
                        'Coin symbol (e.g., "btc", "eth", "ltc"). Determines which getAddress method to use.',
                },
                path: {
                    type: 'string',
                    description:
                        "BIP44 derivation path (e.g., \"m/84'/0'/0'/0/0\" for BTC segwit, \"m/44'/60'/0'/0/0\" for ETH).",
                },
                showOnTrezor: {
                    type: 'boolean',
                    description:
                        'Whether to display the address on the Trezor device screen for verification. Defaults to false.',
                    default: false,
                },
            },
            required: ['coin', 'path'],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
        toConnectCall: (params: { coin: string; path: string; showOnTrezor?: boolean }) => {
            const coin = params.coin.toLowerCase();
            const isEthereum = isEvmCoin(coin);

            return {
                method: isEthereum ? 'ethereumGetAddress' : 'getAddress',
                payload: {
                    ...(!isEthereum && { coin }),
                    path: params.path,
                    showOnTrezor: params.showOnTrezor ?? false,
                },
            };
        },
    },
    {
        name: 'trezor_get_account_info',
        description:
            'Get account information including balance, transaction history, and UTXOs. ' +
            'Works with any supported cryptocurrency. Uses descriptor or path for account lookup.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description: 'Coin symbol (e.g., "btc", "eth", "ltc").',
                },
                path: {
                    type: 'string',
                    description:
                        "BIP44 account-level derivation path (e.g., \"m/84'/0'/0'\" for BTC segwit).",
                },
                descriptor: {
                    type: 'string',
                    description:
                        'Account descriptor (xpub for BTC, address for ETH). Alternative to path.',
                },
                details: {
                    type: 'string',
                    enum: ['basic', 'tokens', 'tokenBalances', 'txids', 'txs'],
                    description: 'Level of detail in the response. Defaults to "basic".',
                    default: 'basic',
                },
            },
            required: ['coin'],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
        toConnectCall: (params: {
            coin: string;
            path?: string;
            descriptor?: string;
            details?: string;
        }) => ({
            method: 'getAccountInfo',
            payload: {
                coin: params.coin.toLowerCase(),
                ...(params.path ? { path: params.path } : {}),
                ...(params.descriptor ? { descriptor: params.descriptor } : {}),
                details: params.details ?? 'basic',
            },
        }),
    },
    {
        name: 'trezor_get_public_key',
        description:
            'Get the extended public key (xpub) for a given derivation path. ' +
            'Useful for account discovery and generating receive addresses without the device.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description: 'Coin symbol (e.g., "btc", "ltc").',
                },
                path: {
                    type: 'string',
                    description:
                        "BIP44 derivation path (e.g., \"m/84'/0'/0'\" for BTC segwit account).",
                },
            },
            required: ['coin', 'path'],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
        toConnectCall: (params: { coin: string; path: string }) => ({
            method: 'getPublicKey',
            payload: {
                coin: params.coin.toLowerCase(),
                path: params.path,
            },
        }),
    },
    {
        name: 'trezor_sign_message',
        description:
            'Sign a message with a private key on the Trezor device. ' +
            'The user must confirm the message on the device screen. ' +
            'Supports Bitcoin and Ethereum message signing.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description: 'Coin symbol (e.g., "btc", "eth").',
                },
                path: {
                    type: 'string',
                    description: 'BIP44 derivation path for the signing key.',
                },
                message: {
                    type: 'string',
                    description: 'The message to sign.',
                },
            },
            required: ['coin', 'path', 'message'],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
        },
        toConnectCall: (params: { coin: string; path: string; message: string }) => {
            const coin = params.coin.toLowerCase();
            const isEthereum = isEvmCoin(coin);

            return {
                method: isEthereum ? 'ethereumSignMessage' : 'signMessage',
                payload: {
                    ...(!isEthereum && { coin }),
                    path: params.path,
                    message: params.message,
                },
            };
        },
    },
    {
        name: 'trezor_verify_message',
        description:
            'Verify a signed message using the Trezor device. ' +
            'Checks that a message was signed by the holder of a given address.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description: 'Coin symbol (e.g., "btc", "eth").',
                },
                address: {
                    type: 'string',
                    description: 'The address that allegedly signed the message.',
                },
                message: {
                    type: 'string',
                    description: 'The original message that was signed.',
                },
                signature: {
                    type: 'string',
                    description: 'The signature to verify.',
                },
            },
            required: ['coin', 'address', 'message', 'signature'],
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
        toConnectCall: (params: {
            coin: string;
            address: string;
            message: string;
            signature: string;
        }) => {
            const coin = params.coin.toLowerCase();
            const isEthereum = isEvmCoin(coin);

            return {
                method: isEthereum ? 'ethereumVerifyMessage' : 'verifyMessage',
                payload: {
                    ...(!isEthereum && { coin }),
                    address: params.address,
                    message: params.message,
                    signature: params.signature,
                },
            };
        },
    },
    {
        name: 'trezor_sign_typed_data',
        description:
            'Sign EIP-712 typed structured data using the Trezor device (EVM chains only). ' +
            'EIP-712 is used for token permits (EIP-2612), NFT marketplace orders, ' +
            'DAO governance votes, and gasless meta-transactions. ' +
            'The user must review and confirm the structured data on the device screen.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                path: {
                    type: 'string',
                    description:
                        "BIP44 derivation path (e.g., \"m/44'/60'/0'/0/0\"). Auto-derived from accountIndex if omitted.",
                },
                accountIndex: {
                    type: 'number',
                    description:
                        'Account index (0 = first account). Defaults to 0. Ignored if "path" is provided.',
                    default: 0,
                },
                data: {
                    type: 'object',
                    description:
                        'EIP-712 typed data object containing "types", "primaryType", "domain", and "message".',
                },
                metamask_v4_compat: {
                    type: 'boolean',
                    description:
                        'Use MetaMask V4 compatibility mode for hashing. Defaults to true.',
                    default: true,
                },
            },
            required: ['data'],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
        },
        toConnectCall: (params: {
            path?: string;
            accountIndex?: number;
            data: Record<string, unknown>;
            metamask_v4_compat?: boolean;
        }) => {
            const accountIndex = params.accountIndex ?? 0;
            const network = getNetworkOptional('eth');
            const defaultPath = network
                ? substituteBip43Path(network.bip43Path, accountIndex)
                : "m/44'/60'/0'/0/0";
            const path = params.path ?? defaultPath;

            return {
                method: 'ethereumSignTypedData',
                payload: {
                    path,
                    data: params.data,
                    metamask_v4_compat: params.metamask_v4_compat ?? true,
                },
            };
        },
    },
    {
        name: 'trezor_send_transaction',
        description:
            'Send a cryptocurrency transaction using the Trezor device. ' +
            'Just provide "to" address, "value", and "coin" — everything else is automatic. ' +
            'For Bitcoin/UTXO chains (btc, ltc, bch, doge, zec): ' +
            'handled by composeTransaction — account, UTXOs, and fees are resolved by Suite. ' +
            'For Ethereum/EVM chains (eth, pol, bsc, arb, base, op, avax, etc): ' +
            'nonce and EIP-1559 gas fees are auto-filled; use "accountIndex" to select account. ' +
            'For XRP: sequence and fee are auto-filled. ' +
            'The transaction is signed on the Trezor device (user confirms on screen) ' +
            'and broadcast to the network by default.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description:
                        'Coin symbol. Supported: eth, pol, bsc, arb, base, op, avax, etc, ' +
                        'tsep, thod (EVM); xrp, txrp (Ripple); btc, ltc, bch, doge, zec (UTXO).',
                },
                to: {
                    type: 'string',
                    description: 'Destination address. Required for EVM and XRP transactions.',
                },
                value: {
                    type: 'string',
                    description:
                        'Amount to send in the native unit (e.g., "0.1" for 0.1 ETH, "10" for 10 XRP). ' +
                        'Automatically converted to the smallest unit (wei, drops, etc.).',
                },
                accountIndex: {
                    type: 'number',
                    description:
                        'Account index to send from (0 = first account, 1 = second, etc.). ' +
                        'Defaults to 0. Ignored if "path" is provided.',
                    default: 0,
                },
                path: {
                    type: 'string',
                    description:
                        'BIP44 derivation path override. If omitted, derived from coin and accountIndex.',
                },
                nonce: {
                    type: 'string',
                    description:
                        'Transaction nonce (EVM) or sequence (XRP). Auto-filled if not provided.',
                },
                gasLimit: {
                    type: 'string',
                    description: 'Gas limit (EVM only). Defaults to "21000" for simple transfers.',
                },
                gasPrice: {
                    type: 'string',
                    description:
                        'Legacy gas price in wei (EVM only). By default EIP-1559 fees are used instead.',
                },
                maxFeePerGas: {
                    type: 'string',
                    description: 'EIP-1559 max fee per gas in wei. Auto-estimated if not provided.',
                },
                maxPriorityFeePerGas: {
                    type: 'string',
                    description:
                        'EIP-1559 max priority fee per gas in wei. Auto-estimated if not provided.',
                },
                data: {
                    type: 'string',
                    description: 'Contract call data hex string (EVM only).',
                },
                chainId: {
                    type: 'number',
                    description: 'EVM chain ID. Auto-derived from coin if not provided.',
                },
                destinationTag: {
                    type: 'number',
                    description: 'Destination tag for XRP transactions.',
                },
                transaction: {
                    type: 'object',
                    description:
                        'Advanced: full transaction object for manual composition. ' +
                        'For BTC this is optional — if omitted, the transaction is auto-composed. ' +
                        'Required for Solana/Cardano/Stellar/Tron (raw params per TrezorConnect docs).',
                },
                broadcast: {
                    type: 'boolean',
                    description: 'Whether to broadcast the signed transaction. Defaults to true.',
                    default: true,
                },
            },
            required: ['coin'],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    {
        name: 'trezor_push_transaction',
        description:
            'Broadcast a signed transaction to the blockchain network. ' +
            'Use this if the transaction was not automatically broadcast after signing.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                coin: {
                    type: 'string',
                    description: 'Coin symbol (e.g., "btc", "eth").',
                },
                tx: {
                    type: 'string',
                    description: 'The signed transaction hex string to broadcast.',
                },
            },
            required: ['coin', 'tx'],
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
        toConnectCall: (params: { coin: string; tx: string }) => ({
            method: 'pushTransaction',
            payload: {
                coin: params.coin.toLowerCase(),
                tx: params.tx,
            },
        }),
    },
];

type PopupCallFn = (call: {
    id: string;
    method: string;
    payload: Record<string, unknown>;
    silent?: boolean;
    origin: string;
    process?: { name: string; fullPath: string; warning: boolean; icon?: string };
    manifest: typeof MCP_MANIFEST;
}) => Promise<unknown>;

type PopupResult = { success: boolean; payload?: any; error?: any };

const callPopup = async (
    sendPopupCall: PopupCallFn,
    method: string,
    payload: Record<string, unknown>,
): Promise<PopupResult> => {
    const response = await sendPopupCall({
        id: nextMessageId(),
        method,
        payload,
        origin: 'mcp://localhost',
        manifest: MCP_MANIFEST,
    });

    return response as PopupResult;
};

/**
 * Call TrezorConnect directly, bypassing the connect-popup flow.
 * Used for data-fetching methods (getAccountInfo, blockchainEstimateFee)
 * that don't need device interaction or user confirmation.
 */
const callSilent = async (
    sendPopupCall: PopupCallFn,
    method: string,
    payload: Record<string, unknown>,
): Promise<PopupResult> => {
    const response = await sendPopupCall({
        id: nextMessageId(),
        method,
        payload,
        silent: true,
        origin: 'mcp://localhost',
        manifest: MCP_MANIFEST,
    });

    return response as PopupResult;
};

/**
 * Auto-broadcast a signed transaction. Returns enhanced result with txHash on success.
 */
const autoBroadcast = async (
    sendPopupCall: PopupCallFn,
    coin: string,
    signResult: PopupResult,
    broadcast: boolean,
): Promise<PopupResult> => {
    if (!broadcast || !signResult.success) return signResult;

    const serializedTx = signResult.payload?.serializedTx;
    if (!serializedTx) return signResult;

    const broadcastResult = await callPopup(sendPopupCall, 'pushTransaction', {
        coin,
        tx: serializedTx,
    });
    if (broadcastResult.success) {
        return {
            success: true,
            payload: {
                txHash: broadcastResult.payload?.txid,
                ...signResult.payload,
            },
        };
    }

    // Signing succeeded but broadcast failed — return both
    return {
        success: true,
        payload: {
            signed: signResult.payload,
            broadcastError: broadcastResult.error,
        },
    };
};

/**
 * Handle EVM transaction: auto-fill nonce and fees (EIP-1559 by default), sign, broadcast.
 */
const handleEvmSend = async (
    params: Record<string, unknown>,
    sendPopupCall: PopupCallFn,
    coin: string,
    path: string,
): Promise<PopupResult> => {
    const to = params.to as string;
    const value = params.value as string;
    if (!to || !value) {
        return { success: false, error: 'EVM transactions require "to" and "value" fields.' };
    }

    let nonce = params.nonce as string | undefined;
    // 21000 for simple ETH transfers, 100000 for contract calls (ERC-20 etc.)
    const defaultGasLimit = params.data ? '100000' : '21000';
    const gasLimit = (params.gasLimit as string) ?? defaultGasLimit;
    const chainId = (params.chainId as number) ?? getNetworkOptional(coin)?.chainId ?? 1;

    // Auto-fill nonce (silent — no popup UI needed)
    if (nonce === undefined) {
        const accountResult = await callSilent(sendPopupCall, 'getAccountInfo', {
            coin,
            path,
            details: 'basic',
        });
        if (!accountResult.success) {
            return {
                success: false,
                error: `Failed to get account info for nonce: ${JSON.stringify(accountResult.error)}`,
            };
        }
        nonce = String(accountResult.payload?.misc?.nonce ?? '0');
    }

    // Build transaction object
    const transaction: Record<string, unknown> = {
        to,
        value: '0x' + BigInt(coinToSmallestUnit(value, coin)).toString(16),
        nonce: toHex(nonce ?? '0'),
        chainId,
        data: (params.data as string) ?? '0x',
    };
    transaction.gasLimit = toHex(gasLimit);

    // Determine fee strategy: explicit gasPrice → legacy; otherwise EIP-1559 (default)
    if (params.gasPrice !== undefined) {
        // Legacy mode — user explicitly chose gasPrice
        transaction.gasPrice = toHex(params.gasPrice as string);
    } else {
        // EIP-1559 mode (default)
        let maxFeePerGas = params.maxFeePerGas as string | undefined;
        let maxPriorityFeePerGas = params.maxPriorityFeePerGas as string | undefined;

        if (maxFeePerGas === undefined) {
            // Try estimating fees via the blockchain backend (silent call).
            // Uses feeLevels: 'smart' to match Suite's fee estimation approach,
            // which returns economy/normal/high tiers. We pick "normal" by default.
            // On failure, fall back to placeholder values — the Suite pre-hook
            // for ethereumSignTransaction allows fee adjustment in the UI.
            try {
                const feeResult = await callSilent(sendPopupCall, 'blockchainEstimateFee', {
                    coin,
                    request: { blocks: [2], feeLevels: 'smart' },
                });
                const levels = feeResult.success ? feeResult.payload?.levels : undefined;
                const level =
                    levels?.find((l: { label?: string }) => l.label === 'normal') ?? levels?.[0];
                if (level?.maxFeePerGas) {
                    maxFeePerGas = level.maxFeePerGas;
                    maxPriorityFeePerGas =
                        maxPriorityFeePerGas ?? level.maxPriorityFeePerGas ?? '0';
                } else if (level?.feePerUnit) {
                    // Network doesn't support EIP-1559 — use legacy
                    transaction.gasPrice = toHex(level.feePerUnit);
                }
            } catch {
                // Fee estimation failed — will use defaults below
            }
        }

        // If fee estimation failed, use placeholder values. The Suite
        // pre-hook for ethereumSignTransaction shows a fee adjustment UI
        // where the user picks the actual fee before signing.
        if (maxFeePerGas === undefined && transaction.gasPrice === undefined) {
            maxFeePerGas = '0x0';
            maxPriorityFeePerGas = maxPriorityFeePerGas ?? '0x0';
        }

        if (maxFeePerGas !== undefined && transaction.gasPrice === undefined) {
            transaction.maxFeePerGas = toHex(maxFeePerGas);
            transaction.maxPriorityFeePerGas = toHex(maxPriorityFeePerGas ?? '0');
        }
    }

    const signResult = await callPopup(sendPopupCall, 'ethereumSignTransaction', {
        path,
        transaction,
    });

    return autoBroadcast(sendPopupCall, coin, signResult, params.broadcast !== false);
};

/**
 * Handle XRP transaction: auto-fill sequence and fee, sign, broadcast.
 */
const handleXrpSend = async (
    params: Record<string, unknown>,
    sendPopupCall: PopupCallFn,
    coin: string,
    path: string,
): Promise<PopupResult> => {
    const to = params.to as string;
    const value = params.value as string;
    if (!to || !value) {
        return { success: false, error: 'XRP transactions require "to" and "value" fields.' };
    }

    let sequence = params.nonce !== undefined ? Number(params.nonce) : undefined;

    // Auto-fill sequence from account info (silent — no popup UI needed)
    if (sequence === undefined) {
        const accountResult = await callSilent(sendPopupCall, 'getAccountInfo', {
            coin,
            path,
            details: 'basic',
        });
        if (!accountResult.success) {
            return {
                success: false,
                error: `Failed to get account info for sequence: ${JSON.stringify(accountResult.error)}`,
            };
        }
        sequence = Number(accountResult.payload?.misc?.sequence ?? 0);
    }

    // Auto-fill fee (default 12 drops if estimation fails)
    let fee = '12';
    try {
        const feeResult = await callSilent(sendPopupCall, 'blockchainEstimateFee', {
            coin,
        });
        if (feeResult.success && feeResult.payload?.levels?.[0]?.feePerUnit) {
            fee = feeResult.payload.levels[0].feePerUnit;
        }
    } catch {
        // Fee estimation failed — use default 12 drops
    }

    const signResult = await callPopup(sendPopupCall, 'rippleSignTransaction', {
        path,
        transaction: {
            fee,
            sequence,
            payment: {
                amount: coinToSmallestUnit(value, coin),
                destination: to,
                ...(params.destinationTag !== undefined
                    ? { destinationTag: params.destinationTag as number }
                    : {}),
            },
        },
    });

    return autoBroadcast(sendPopupCall, coin, signResult, params.broadcast !== false);
};

/**
 * Handle BTC/UTXO transaction via a single composeTransaction call with push=true.
 * TrezorConnect handles everything internally: account discovery, fee estimation,
 * UTXO selection, fee level selection, signing, and broadcasting.
 */
const handleUtxoSend = (
    params: Record<string, unknown>,
    sendPopupCall: PopupCallFn,
    coin: string,
): Promise<PopupResult> => {
    const to = params.to as string;
    const value = params.value as string;
    if (!to || !value) {
        return Promise.resolve({
            success: false,
            error: 'BTC/UTXO transactions require "to" and "value" fields.',
        });
    }

    return callPopup(sendPopupCall, 'composeTransaction', {
        outputs: [
            {
                type: 'payment',
                address: to,
                amount: coinToSmallestUnit(value, coin),
            },
        ],
        coin,
        push: params.broadcast !== false,
    });
};

/**
 * Handle send transaction for any supported coin type.
 * Routes to specialized handlers for EVM, XRP, and UTXO chains.
 * Falls back to generic signTransaction for other chains.
 */
const handleSendTransaction = async (
    params: Record<string, unknown>,
    sendPopupCall: PopupCallFn,
): Promise<PopupResult> => {
    const coin = (params.coin as string).toLowerCase();
    const accountIndex = (params.accountIndex as number) ?? 0;
    const network = getNetworkOptional(coin);
    const defaultPath = network ? substituteBip43Path(network.bip43Path, accountIndex) : undefined;
    const path = (params.path as string) ?? defaultPath;
    if (!path) {
        return {
            success: false,
            error: `Unknown coin "${coin}" and no explicit "path" provided.`,
        };
    }

    if (isEvmCoin(coin)) {
        return handleEvmSend(params, sendPopupCall, coin, path);
    }

    if (isXrpCoin(coin)) {
        return handleXrpSend(params, sendPopupCall, coin, path);
    }

    if (isUtxoCoin(coin)) {
        // If user provided a full transaction object, sign it directly (advanced mode)
        if (params.transaction) {
            const signResult = await callPopup(sendPopupCall, 'signTransaction', {
                coin,
                path,
                ...(params.transaction as Record<string, unknown>),
            });

            return autoBroadcast(sendPopupCall, coin, signResult, params.broadcast !== false);
        }

        // Otherwise, single composeTransaction call — TrezorConnect handles everything
        return handleUtxoSend(params, sendPopupCall, coin);
    }

    // Generic fallback for other chains (Solana, Cardano, Stellar, Tron):
    // requires a full transaction object
    const txObj = params.transaction as Record<string, unknown>;
    if (!txObj) {
        return {
            success: false,
            error:
                `${coin.toUpperCase()} transactions require a "transaction" object. ` +
                'See TrezorConnect documentation for the expected format.',
        };
    }

    const signMethods: Record<string, string> = {
        sol: 'solanaSignTransaction',
        dsol: 'solanaSignTransaction',
        ada: 'cardanoSignTransaction',
        xlm: 'stellarSignTransaction',
        txlm: 'stellarSignTransaction',
        trx: 'tronSignTransaction',
    };
    const signMethod = signMethods[coin] ?? 'signTransaction';

    const signResult = await callPopup(sendPopupCall, signMethod, {
        coin,
        path,
        ...txObj,
    });

    return autoBroadcast(sendPopupCall, coin, signResult, params.broadcast !== false);
};

/**
 * Handle a JSON-RPC request and return a JSON-RPC response.
 */
const handleJsonRpcRequest = async (
    request: { id?: string | number; method: string; params?: Record<string, unknown> },
    sendPopupCall: PopupCallFn,
): Promise<Record<string, unknown>> => {
    const { id, method, params } = request;

    if (method === 'initialize') {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion: '2025-03-26',
                serverInfo: {
                    name: 'trezor-suite-mcp-server',
                    version: '1.0.0',
                },
                capabilities: {
                    tools: {},
                },
            },
        };
    }

    if (method === 'tools/list') {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                tools: MCP_TOOLS.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    annotations: tool.annotations,
                })),
            },
        };
    }

    if (method === 'tools/call') {
        const toolName = (params as { name?: string })?.name;
        const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments ?? {};
        const tool = MCP_TOOLS.find(t => t.name === toolName);

        if (!tool) {
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32602,
                    message: `Unknown tool: ${toolName}`,
                },
            };
        }

        try {
            let result: PopupResult;

            if (tool.name === 'trezor_send_transaction') {
                // Multi-step flow: auto-fill → sign → broadcast
                result = await handleSendTransaction(toolArgs, sendPopupCall);
            } else {
                // Single-call tools
                const { method: connectMethod, payload } = (
                    tool as { toConnectCall: (args: any) => { method: string; payload: any } }
                ).toConnectCall(toolArgs);
                result = await callPopup(sendPopupCall, connectMethod, payload);
            }

            if (result.success) {
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result.payload, null, 2),
                            },
                        ],
                    },
                };
            }

            return {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${JSON.stringify(result.error)}`,
                        },
                    ],
                    isError: true,
                },
            };
        } catch (error) {
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                    isError: true,
                },
            };
        }
    }

    // Notifications (no id) — just acknowledge
    if (id === undefined) {
        return {};
    }

    return {
        jsonrpc: '2.0',
        id,
        error: {
            code: -32601,
            message: `Method not found: ${method}`,
        },
    };
};

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

/**
 * Read and parse JSON body from an HTTP request.
 */
const readJsonBody = (req: http.IncomingMessage): Promise<unknown> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let rejected = false;
        req.on('data', (chunk: Buffer) => {
            if (rejected) return;
            size += chunk.length;
            if (size > MAX_BODY_SIZE) {
                rejected = true;
                req.resume(); // Drain remaining data without buffering
                reject(new Error('Payload too large'));

                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (rejected) return;
            try {
                const body = Buffer.concat(chunks).toString();
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });

export const init: ModuleInit = ({ mainWindowProxy, store }) => {
    const { logger } = global;
    let server: http.Server | null = null;
    let sessionId: string | null = null;
    let sessionProcessInfo: ConnectProcessInfo | undefined;
    let sessionManifest: typeof MCP_MANIFEST = MCP_MANIFEST;

    const startServer = (port: number) => {
        if (server) {
            logger.info(LOG_PREFIX, 'MCP server is already running');

            return;
        }

        const sendPopupCall = (call: {
            id: string;
            method: string;
            payload: Record<string, unknown>;
            silent?: boolean;
            origin: string;
            process?: {
                name: string;
                fullPath: string;
                warning: boolean;
                icon?: string;
            };
            manifest: typeof MCP_MANIFEST;
        }) => {
            const mainWindow = mainWindowProxy.getInstance();
            if (!mainWindow) {
                logger.error(LOG_PREFIX, 'Main window is not available for MCP call');

                return Promise.resolve({
                    success: false,
                    error: 'Trezor Suite window is not available.',
                });
            }

            const deferred = addMessage(call.id);

            mainWindow.webContents.send('connect-popup/call', {
                id: call.id,
                method: call.method,
                payload: call.payload,
                silent: call.silent,
                sourceType: CALL_SOURCE_MCP,
                origin: call.origin,
                process: call.process ?? sessionProcessInfo,
                manifest: sessionManifest,
            });

            return deferred.promise;
        };

        server = http.createServer(async (req, res) => {
            // Only allow localhost connections
            const { remoteAddress } = req.socket;
            if (remoteAddress !== '127.0.0.1') {
                logger.error(LOG_PREFIX, `Rejected connection from ${remoteAddress}`);
                res.writeHead(403);
                res.end();

                return;
            }

            // No CORS headers — this server is for local native MCP clients only,
            // not for browser-based access. Rejecting CORS prevents cross-origin
            // data exfiltration from malicious webpages.
            if (req.method === 'OPTIONS') {
                res.writeHead(405);
                res.end();

                return;
            }

            // Validate Bearer token authentication
            const { token } = store.getMcpSettings();
            if (!token) {
                logger.error(LOG_PREFIX, 'Rejected request: no authentication token configured');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Server misconfiguration: no auth token' }));

                return;
            }
            const authHeader = req.headers.authorization;
            const expected = Buffer.from(`Bearer ${token}`);
            const received = Buffer.from(authHeader ?? '');
            if (
                expected.length !== received.length ||
                !crypto.timingSafeEqual(expected, received)
            ) {
                logger.error(LOG_PREFIX, 'Rejected request: invalid or missing Bearer token');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        error: 'Unauthorized. A valid Authorization: Bearer <token> header is required. Copy the token from Trezor Suite: Settings → Debug → MCP Server config snippet.',
                    }),
                );

                return;
            }

            const pathname = req.url?.split('?')[0];

            // Handle /mcp endpoint
            if (pathname === '/mcp') {
                // GET /mcp is for SSE streaming — we don't support it
                if (req.method === 'GET') {
                    res.writeHead(405);
                    res.end();

                    return;
                }

                // DELETE /mcp is for session termination
                if (req.method === 'DELETE') {
                    sessionId = null;
                    sessionProcessInfo = undefined;
                    sessionManifest = MCP_MANIFEST;
                    res.writeHead(200);
                    res.end();

                    return;
                }
            }

            if (req.method !== 'POST' || pathname !== '/mcp') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found. Use POST /mcp' }));

                return;
            }

            // Per MCP spec, clients MUST include Mcp-Session-Id once assigned.
            const requestSessionId = req.headers['mcp-session-id'] as string | undefined;
            if (sessionId && requestSessionId !== sessionId) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Session not found' }));

                return;
            }

            try {
                const body = await readJsonBody(req);
                const jsonRpcRequest = body as {
                    id?: string | number;
                    method: string;
                    params?: Record<string, unknown>;
                };

                logger.debug(LOG_PREFIX, `Request: ${jsonRpcRequest.method}`);

                // Assign session ID and resolve calling process on initialize
                if (jsonRpcRequest.method === 'initialize') {
                    sessionId = crypto.randomUUID();

                    // Identify the calling process via TCP port lookup + MCP clientInfo
                    const clientInfo = (
                        jsonRpcRequest.params as {
                            clientInfo?: { name?: string; version?: string };
                        }
                    )?.clientInfo;

                    const { remotePort } = req.socket;
                    if (remotePort) {
                        const processInfo = await findProcessFromIncomingPort(
                            remotePort,
                            true,
                        ).catch(() => {
                            logger.warn(LOG_PREFIX, 'findProcessFromIncomingPort failed');

                            return undefined;
                        });

                        if (processInfo) {
                            sessionProcessInfo = {
                                name: processInfo.name,
                                fullPath: processInfo.fullPath,
                                warning: !!processInfo.warning,
                                icon: await getProcessIcon(processInfo.fullPath),
                            };
                        } else if (clientInfo?.name) {
                            sessionProcessInfo = {
                                name: clientInfo.name,
                                fullPath: clientInfo.name,
                                warning: true,
                            };
                        }
                    } else if (clientInfo?.name) {
                        sessionProcessInfo = {
                            name: clientInfo.name,
                            fullPath: clientInfo.name,
                            warning: true,
                        };
                    }

                    if (clientInfo?.name) {
                        sessionManifest = { ...MCP_MANIFEST, appName: clientInfo.name };
                    }

                    logger.info(
                        LOG_PREFIX,
                        `Session initialized for process: ${sessionProcessInfo?.name ?? 'unknown'}`,
                    );
                }

                const response = await handleJsonRpcRequest(jsonRpcRequest, sendPopupCall);

                // For notifications (no id), return 202 with no body
                if (jsonRpcRequest.id === undefined) {
                    res.writeHead(202);
                    res.end();

                    return;
                }

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (sessionId) {
                    headers['Mcp-Session-Id'] = sessionId;
                }

                res.writeHead(200, headers);
                res.end(JSON.stringify(response));
            } catch (error) {
                logger.error(LOG_PREFIX, `Request error: ${error}`);
                const isPayloadTooLarge =
                    error instanceof Error && error.message === 'Payload too large';
                const statusCode = isPayloadTooLarge ? 413 : 400;
                const errorPayload = isPayloadTooLarge
                    ? { code: -32600, message: 'Payload too large' }
                    : { code: -32700, message: 'Parse error' };
                res.writeHead(statusCode, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        error: errorPayload,
                    }),
                );
            }
        });

        server.listen(port, '127.0.0.1', () => {
            logger.info(LOG_PREFIX, `MCP server listening on http://127.0.0.1:${port}/mcp`);
        });

        server.on('error', error => {
            logger.error(LOG_PREFIX, `Server error: ${error}`);
            server = null;
            sessionId = null;
            sessionProcessInfo = undefined;
            sessionManifest = MCP_MANIFEST;
        });
    };

    const stopServer = () => {
        if (server) {
            server.close();
            server = null;
            sessionId = null;
            sessionProcessInfo = undefined;
            sessionManifest = MCP_MANIFEST;
            logger.info(LOG_PREFIX, 'MCP server stopped');
        }
    };

    // IPC handlers for controlling the MCP server from the renderer
    ipcMain.handle('mcp/get-settings', ipcEvent => {
        validateIpcMessage({ ipcEvent });

        const settings = store.getMcpSettings();

        return {
            ...settings,
            running: server !== null,
            url: server ? `http://127.0.0.1:${settings.port}/mcp` : null,
            token: settings.token ?? null,
        };
    });

    ipcMain.handle('mcp/regenerate-token', ipcEvent => {
        validateIpcMessage({ ipcEvent });
        const newToken = generateToken();
        store.setMcpSettings({ token: newToken });

        return { token: newToken };
    });

    ipcMain.handle('mcp/set-enabled', (ipcEvent, enabled: boolean) => {
        validateIpcMessage({ ipcEvent });

        if (typeof enabled !== 'boolean') return;

        const currentSettings = store.getMcpSettings();
        if (enabled && !currentSettings.token) {
            store.setMcpSettings({ enabled, token: generateToken() });
        } else {
            store.setMcpSettings({ enabled });
        }

        if (enabled) {
            const { port } = store.getMcpSettings();
            startServer(port);
        } else {
            stopServer();
        }
    });

    const onLoad = () => {
        const settings = store.getMcpSettings();
        if (settings.enabled) {
            if (!settings.token) {
                store.setMcpSettings({ token: generateToken() });
            }
            startServer(settings.port);
        }
    };

    const onQuit = () => {
        stopServer();
    };

    return { onLoad, onQuit };
};
