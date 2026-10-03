import { type NetworkType } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isNotNullOrUndefined } from '@trezor/utils';

// Poisoners generate vanity addresses matching both ends of one the user has transacted with, since
// that is what truncated addresses in wallets and explorers show. Tunable starting point.
const LOOKALIKE_PREFIX_LENGTH = 3;
const LOOKALIKE_SUFFIX_LENGTH = 4;

const isRecipientHistoryCheckSupportedByNetworkType: Record<NetworkType, boolean> = {
    bitcoin: false,
    cardano: false,
    ethereum: true,
    ripple: false,
    // Outgoing SPL transfers record the recipient's token account, not the wallet address users paste.
    solana: false,
    stellar: false,
    tron: true,
};

export const isRecipientHistoryCheckSupported = (networkType: NetworkType) =>
    isRecipientHistoryCheckSupportedByNetworkType[networkType];

const normalizeAddress = (address: string, networkType: NetworkType) =>
    networkType === 'ethereum' ? address.toLowerCase() : address;

// The characters every address of the network starts with would make any two of them a prefix match.
const getLookalikeComparedPart = (normalizedAddress: string, networkType: NetworkType) => {
    if (networkType === 'ethereum') return normalizedAddress.replace(/^0x/, '');
    if (networkType === 'tron') return normalizedAddress.replace(/^T/, '');

    return normalizedAddress;
};

const isNormalizedLookalike = (a: string, b: string, networkType: NetworkType) => {
    if (a === b) return false;

    const partA = getLookalikeComparedPart(a, networkType);
    const partB = getLookalikeComparedPart(b, networkType);

    return (
        partA.slice(0, LOOKALIKE_PREFIX_LENGTH) === partB.slice(0, LOOKALIKE_PREFIX_LENGTH) &&
        partA.slice(-LOOKALIKE_SUFFIX_LENGTH) === partB.slice(-LOOKALIKE_SUFFIX_LENGTH)
    );
};

export const isLookalikeAddress = (a: string, b: string, networkType: NetworkType) =>
    isNormalizedLookalike(
        normalizeAddress(a, networkType),
        normalizeAddress(b, networkType),
        networkType,
    );

export type RecipientHistory = {
    // Counterparties of transactions the user signed.
    sentTo: ReadonlySet<string>;
    // Counterparties of any transaction not flagged as phishing.
    known: ReadonlySet<string>;
    // Counterparties of transactions flagged as phishing.
    phishing: ReadonlySet<string>;
};

const getTransactionCounterparties = (transaction: WalletAccountTransaction) => [
    ...transaction.details.vin.flatMap(vin => vin.addresses ?? []),
    ...transaction.details.vout.flatMap(vout => vout.addresses ?? []),
    ...transaction.targets.flatMap(target => target.addresses ?? []),
    ...transaction.tokens.flatMap(token => [token.from, token.to]),
    ...transaction.internalTransfers.flatMap(transfer => [transfer.from, transfer.to]),
];

type GetRecipientHistoryParams = {
    transactions: WalletAccountTransaction[];
    descriptor: string;
    networkType: NetworkType;
    isPhishing: (transaction: WalletAccountTransaction) => boolean;
};

export const getRecipientHistory = ({
    transactions,
    descriptor,
    networkType,
    isPhishing,
}: GetRecipientHistoryParams): RecipientHistory => {
    const ownAddress = normalizeAddress(descriptor, networkType);
    const sentTo = new Set<string>();
    const known = new Set<string>();
    const phishing = new Set<string>();

    transactions.forEach(transaction => {
        // A transfer out of the account can be spoofed (zero-value transferFrom, fake tokens), so only
        // the account being a sender of the transaction itself proves the user signed it.
        const isSignedByUser = transaction.details.vin.some(vin =>
            vin.addresses?.some(address => normalizeAddress(address, networkType) === ownAddress),
        );
        const isPhishingTransaction = isPhishing(transaction);

        getTransactionCounterparties(transaction)
            .filter(isNotNullOrUndefined)
            .map(address => normalizeAddress(address, networkType))
            .filter(address => address !== ownAddress)
            .forEach(address => {
                if (isPhishingTransaction) {
                    phishing.add(address);

                    return;
                }

                known.add(address);
                if (isSignedByUser) sentTo.add(address);
            });
    });

    return { sentTo, known, phishing };
};

export type RecipientRisk = 'poisoning' | 'new';

type GetRecipientRiskParams = {
    address: string;
    history: RecipientHistory;
    networkType: NetworkType;
};

export const getRecipientRisk = ({
    address,
    history,
    networkType,
}: GetRecipientRiskParams): RecipientRisk | undefined => {
    const { sentTo, known, phishing } = history;
    const recipient = normalizeAddress(address, networkType);

    // An address the user paid before is trusted even though a poisoner may have imitated it since.
    if (sentTo.has(recipient)) return undefined;

    const hasLookalike = [...known, ...phishing].some(counterparty =>
        isNormalizedLookalike(recipient, counterparty, networkType),
    );
    if (hasLookalike || (phishing.has(recipient) && !known.has(recipient))) return 'poisoning';

    // A funded account always has a transaction, so no counterparties means the history isn't loaded.
    if (known.size === 0 && phishing.size === 0) return undefined;

    return known.has(recipient) ? undefined : 'new';
};
