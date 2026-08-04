import type { MessageTypes } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';
import type {
    ParsedTransactionWithMeta,
    Signature,
    Slot,
    SolanaAPI,
    SolanaValidParsedTxWithMeta,
} from '@trezor/network-solana/types';
import { type Cache, isNotNullOrUndefined } from '@trezor/utils';

import type { SignatureWithSlot } from './types';

// The `getSignaturesForAddress` result is raw JSON from a user-selectable Solana RPC backend; the
// @solana/kit rpc layer performs no response-shape validation, so a malformed or malicious backend
// may return a non-array (or omit it). A bare `.map` on such a value throws synchronously and
// rejects the whole getAllSignatures call, which aborts account discovery / getAccountInfo
// (per-account history DoS). Guard the array shape before mapping.
export const transformSignatureInfos = (
    signaturesInfos: readonly { signature: Signature; slot: Slot }[] | undefined,
): SignatureWithSlot[] =>
    Array.isArray(signaturesInfos)
        ? signaturesInfos.map(info => ({ signature: info.signature, slot: info.slot }))
        : [];

export const getAllSignatures = async (
    api: SolanaAPI,
    descriptor: MessageTypes.GetAccountInfo['payload']['descriptor'],
    fullHistory = false,
) => {
    const { address } = await solana();
    let lastSignature: SignatureWithSlot | undefined;
    let keepFetching = true;
    let allSignatures: SignatureWithSlot[] = [];

    const defaultValueLimit = 100; // default value of getSignaturesForAddress
    while (keepFetching) {
        const signaturesInfos = await api.rpc
            .getSignaturesForAddress(address(descriptor), {
                before: lastSignature?.signature,
                limit: defaultValueLimit,
            })
            .send();

        const signatures = transformSignatureInfos(signaturesInfos);
        lastSignature = signatures[signatures.length - 1];
        keepFetching = signatures.length === defaultValueLimit && fullHistory;
        allSignatures = [...allSignatures, ...signatures];
    }

    return allSignatures;
};

// getMultipleAccounts accepts at most 100 addresses per call
const MULTIPLE_ACCOUNTS_LIMIT = 100;
// Bounds how long an unchanged address may reuse its cached signatures. A transaction can mention
// an address without altering its state, and only a refetch discovers those.
const SIGNATURES_CACHE_TTL = 10 * 60 * 1000;
// Unfunded addresses do not exist on chain. Cannot collide with a real fingerprint, which always
// contains a separator.
const NONEXISTENT_ACCOUNT_FINGERPRINT = 'nonexistent';

type CachedSignatures = { fingerprint: string; signatures: SignatureWithSlot[] };

const getAccountFingerprints = async (api: SolanaAPI, descriptors: string[]) => {
    const { address } = await solana();
    const fingerprints = new Map<string, string>();

    for (let i = 0; i < descriptors.length; i += MULTIPLE_ACCOUNTS_LIMIT) {
        const chunk = descriptors.slice(i, i + MULTIPLE_ACCOUNTS_LIMIT);
        const { value } = await api.rpc
            .getMultipleAccounts(chunk.map(address), { encoding: 'base64' })
            .send();

        chunk.forEach((descriptor, index) => {
            const account = value[index];
            fingerprints.set(
                descriptor,
                account
                    ? `${account.lamports}:${account.data[0]}`
                    : NONEXISTENT_ACCOUNT_FINGERPRINT,
            );
        });
    }

    return fingerprints;
};

// A single getMultipleAccounts call reveals which addresses moved, so the signature fan-out — by
// far the most expensive part of a sync — only runs for those.
export const getSignaturesForAddresses = async (
    api: SolanaAPI,
    descriptors: string[],
    cache: Cache,
) => {
    const fingerprints = await getAccountFingerprints(api, descriptors);

    return Promise.all(
        descriptors.map(async descriptor => {
            const fingerprint = fingerprints.get(descriptor);
            const cacheKey = `signatures/${descriptor}`;
            const cached: CachedSignatures | undefined = cache.get(cacheKey);

            if (fingerprint && cached?.fingerprint === fingerprint) {
                return cached.signatures;
            }

            const signatures = await getAllSignatures(api, descriptor);
            if (fingerprint) {
                cache.set(cacheKey, { fingerprint, signatures }, SIGNATURES_CACHE_TTL);
            }

            return signatures;
        }),
    );
};

export const fetchTransactionPage = async (
    api: SolanaAPI,
    signatures: Signature[],
): Promise<ParsedTransactionWithMeta[]> =>
    (
        await Promise.all(
            signatures.map(signature =>
                api.rpc
                    .getTransaction(signature, {
                        encoding: 'jsonParsed',
                        maxSupportedTransactionVersion: 0,
                        commitment: 'confirmed',
                    })
                    .send(),
            ),
        )
    ).filter(isNotNullOrUndefined);

export const isValidTransaction = (
    tx: ParsedTransactionWithMeta,
): tx is SolanaValidParsedTxWithMeta =>
    // This type-predicate must guarantee everything solanaUtils.transformTransaction / getDetails
    // dereference *unconditionally* while mapping a whole account-history page — an untrusted or
    // compromised RPC (endpoint is user-selectable / MITM-able and the `jsonParsed` response is not
    // schema-validated) can return an otherwise-valid tx that omits one of these fields, and a single
    // throw fails the entire page `.map` (poison one record → fail entire page). Concretely:
    //   - `transaction.signatures[0]` → txid (solana.ts getDetails / transformTransaction)
    //   - `transaction.message.accountKeys.map(...)` (getNativeEffects, reached first)
    //   - `transaction.message.instructions.some(...)` (getTxType)
    //   - `meta.preBalances[i]` / `meta.postBalances[i]` (extractAccountBalanceDiff)
    //   - `meta.fee.toString()` (getNativeTransferTxType)
    // Their TS types mark them non-optional, so downstream code trusts them; validate them here so
    // malformed records are dropped at the boundary instead of crashing the page.
    !!(
        tx?.meta &&
        tx.transaction &&
        tx.blockTime &&
        tx.transaction.signatures?.length &&
        Array.isArray(tx.transaction.message?.accountKeys) &&
        Array.isArray(tx.transaction.message?.instructions) &&
        Array.isArray(tx.meta.preBalances) &&
        Array.isArray(tx.meta.postBalances) &&
        tx.meta.fee != null
    );
