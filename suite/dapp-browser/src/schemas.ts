import { z } from 'zod';

// Zod schemas validating all untrusted dApp → provider → router data at the
// boundary (§7, §12). Malformed input is rejected with -32602 before dispatch;
// EIP-1193 mandates validating all provider data.

/** 0x-prefixed hex string (possibly empty data). */
export const hexStringSchema = z
    .string()
    .regex(/^0x[0-9a-fA-F]*$/, 'Expected a 0x-prefixed hex string');

/** 20-byte EVM address. */
export const addressSchema = z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Expected a 0x-prefixed 20-byte address');

/** The EIP-1193 request envelope. */
export const eip1193RequestSchema = z.object({
    method: z.string().min(1),
    params: z.unknown().optional(),
});

/** `eth_sendTransaction` params: a single tx object wrapped in an array. */
export const sendTransactionParamsSchema = z.tuple([
    z.object({
        from: addressSchema,
        to: addressSchema.optional(),
        gas: hexStringSchema.optional(),
        gasPrice: hexStringSchema.optional(),
        maxFeePerGas: hexStringSchema.optional(),
        maxPriorityFeePerGas: hexStringSchema.optional(),
        value: hexStringSchema.optional(),
        data: hexStringSchema.optional(),
        nonce: hexStringSchema.optional(),
        chainId: hexStringSchema.optional(),
    }),
]);

/** `personal_sign` params: [message, address] (MetaMask order). */
export const personalSignParamsSchema = z.tuple([z.string(), addressSchema]);

/** `eth_signTypedData_v4` params: [address, jsonStringOrObject]. */
export const signTypedDataParamsSchema = z.tuple([
    addressSchema,
    z.union([z.string(), z.record(z.string(), z.unknown())]),
]);

/** `wallet_switchEthereumChain` params: [{ chainId }]. */
export const switchChainParamsSchema = z.tuple([z.object({ chainId: hexStringSchema })]);

/** A WalletConnect pairing URI read from the clipboard (§5). */
export const walletConnectUriSchema = z.string().startsWith('wc:', 'Not a WalletConnect URI');

const namespaceSchema = z.enum(['eip155', 'tron', 'solana', 'cardano', 'bip122']);

const trustTierSchema = z.enum(['general', 'trezor-connect']);

/** A curated catalog entry — validated at load (§6, §12). */
export const dappCatalogEntrySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    origin: z.string().startsWith('https://'),
    url: z.string().startsWith('https://'),
    iconUrl: z.string().min(1),
    description: z.string().min(1),
    namespaces: z.array(namespaceSchema).min(1),
    chains: z.array(z.number().int().positive()).min(1),
    trustTier: trustTierSchema,
});

export const dappCatalogSchema = z.array(dappCatalogEntrySchema);
