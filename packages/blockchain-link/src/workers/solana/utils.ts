import type { MessageTypes } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';
import type {
    ParsedTransactionWithMeta,
    Signature,
    SolanaAPI,
    SolanaValidParsedTxWithMeta,
} from '@trezor/network-solana/types';
import { type Cache, isNotNullOrUndefined } from '@trezor/utils';

import type { SignatureWithSlot } from './types';

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

        const signatures = signaturesInfos.map(info => ({
            signature: info.signature,
            slot: info.slot,
        }));
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
): tx is SolanaValidParsedTxWithMeta => !!(tx?.meta && tx.transaction && tx.blockTime);
