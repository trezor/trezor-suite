import {
    type Hex,
    type TransactionSerializedLegacy,
    keccak256,
    parseTransaction,
    recoverTransactionAddress,
    serializeTransaction,
} from 'viem';

import { type Result, err, ok } from '@trezor/type-utils';

import type { EthereumSweepPlan } from './composeEthereumSweep';

/** Signature as the legacy `EthereumTxRequest` carries it: `v` already includes the chain id. */
export type EthereumSignature = {
    v: number;
    /** 32 bytes as hex without the `0x` prefix. */
    r: string;
    s: string;
};

export type SignedEthereumSweepError = {
    type: 'signed-transaction-invalid';
    reason: string;
};

export type SignedEthereumSweep = {
    hex: Hex;
    /** Hash of the signed transaction. Unlike a legacy Bitcoin id, nobody can change it. */
    txid: Hex;
};

const EIP155_V_BASE = 35;

const SIGNATURE_COMPONENT_PATTERN = /^[0-9a-fA-F]{1,64}$/;

const toHex = (value: string): Hex => `0x${value}`;

const toUnsignedTransaction = (plan: EthereumSweepPlan) => ({
    type: 'legacy' as const,
    chainId: plan.chainId,
    nonce: plan.nonce,
    gasPrice: BigInt(plan.gasPrice),
    gas: BigInt(plan.gasLimit),
    to: plan.destination.address,
    value: BigInt(plan.amount),
});

export type VerifySignedEthereumSweepParams = {
    plan: EthereumSweepPlan;
    signature: EthereumSignature;
};

/**
 * Builds the signed transaction from the plan and the signature the device returned, and proves
 * that it is the planned one: it must parse back to exactly the planned fields, and the signer it
 * recovers to must be the address being emptied. A transaction failing either check is dropped.
 */
export const verifySignedEthereumSweep = async ({
    plan,
    signature,
}: VerifySignedEthereumSweepParams): Promise<
    Result<SignedEthereumSweep, SignedEthereumSweepError>
> => {
    const invalid = (reason: string) =>
        err({ type: 'signed-transaction-invalid' as const, reason });

    const expectedVs = [EIP155_V_BASE, EIP155_V_BASE + 1].map(base => base + 2 * plan.chainId);
    if (!expectedVs.includes(signature.v)) return invalid('signature v does not encode the chain');
    if (![signature.r, signature.s].every(part => SIGNATURE_COMPONENT_PATTERN.test(part))) {
        return invalid('signature components are not 32-byte numbers');
    }

    let hex: TransactionSerializedLegacy;
    try {
        hex = serializeTransaction(toUnsignedTransaction(plan), {
            v: BigInt(signature.v),
            r: toHex(signature.r),
            s: toHex(signature.s),
        });
    } catch (error) {
        return invalid(error instanceof Error ? error.message : 'serialization failed');
    }

    let signer: string;
    try {
        const parsed = parseTransaction(hex);
        const expected = toUnsignedTransaction(plan);

        if (parsed.type !== 'legacy') return invalid('not a legacy transaction');
        if (parsed.chainId !== expected.chainId) return invalid('chain id differs');
        if (parsed.nonce !== expected.nonce) return invalid('nonce differs');
        if (parsed.gasPrice !== expected.gasPrice) return invalid('gas price differs');
        if (parsed.gas !== expected.gas) return invalid('gas limit differs');
        if (parsed.to?.toLowerCase() !== expected.to.toLowerCase()) {
            return invalid('destination differs');
        }
        if (parsed.value !== expected.value) return invalid('amount differs');
        if (parsed.data !== undefined && parsed.data !== '0x') return invalid('unexpected data');

        signer = await recoverTransactionAddress({ serializedTransaction: hex });
    } catch (error) {
        return invalid(error instanceof Error ? error.message : 'verification failed');
    }

    if (signer.toLowerCase() !== plan.account.address.toLowerCase()) {
        return invalid('signed by a different address');
    }

    return ok({ hex, txid: keccak256(hex) });
};
