import { type NetworkType } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isNotNullOrUndefined } from '@trezor/utils';

// Poisoners generate vanity addresses matching both ends of one the user has transacted with, since
// that is what truncated addresses in wallets and explorers show. Tunable starting point.
const LOOKALIKE_PREFIX_LENGTH = 3;
const LOOKALIKE_SUFFIX_LENGTH = 4;

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

export type RecipientHistory = {
    // Recipients the user signed a payment to, mapped to the block time of the latest confirmed one.
    sentTo: ReadonlyMap<string, number | undefined>;
    // Counterparties of any transaction not flagged as phishing.
    counterparties: ReadonlySet<string>;
    // Counterparties of transactions flagged as phishing.
    phishingCounterparties: ReadonlySet<string>;
};

// Targets mostly repeat vout, but Ripple and Stellar path payments only fill targets. The sets in
// getRecipientHistory drop the duplicates.
const getTransactionCounterparties = (transaction: WalletAccountTransaction) => [
    ...transaction.details.vin.flatMap(vin => vin.addresses ?? []),
    ...transaction.details.vout.flatMap(vout => vout.addresses ?? []),
    ...transaction.targets.flatMap(target => target.addresses ?? []),
    ...transaction.tokens.flatMap(token => [token.from, token.to]),
    ...transaction.internalTransfers.flatMap(transfer => [transfer.from, transfer.to]),
];

// The called contract can emit transfers between arbitrary addresses, so only those paid by the
// account count. Targets mostly repeat vout, but Ripple has no vout and Stellar has none for path
// payments, so both are read. The map in getRecipientHistory drops the duplicates.
const getTransactionPaidRecipients = (
    transaction: WalletAccountTransaction,
    isOwnAddress: (address: string) => boolean,
) => [
    ...transaction.details.vout.flatMap(vout => vout.addresses ?? []),
    ...transaction.targets.flatMap(target => target.addresses ?? []),
    ...[...transaction.tokens, ...transaction.internalTransfers]
        .filter(transfer => isOwnAddress(transfer.from))
        .map(transfer => transfer.to),
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
    const isOwnAddress = (address: string) => normalizeAddress(address, networkType) === ownAddress;
    const sentTo = new Map<string, number | undefined>();
    const counterparties = new Set<string>();
    const phishingCounterparties = new Set<string>();

    const normalizeCounterparties = (addresses: (string | undefined)[]) =>
        addresses
            .filter(isNotNullOrUndefined)
            .map(address => normalizeAddress(address, networkType))
            .filter(address => address !== ownAddress);

    transactions.forEach(transaction => {
        const transactionCounterparties = normalizeCounterparties(
            getTransactionCounterparties(transaction),
        );
        const counterpartiesTarget = isPhishing(transaction)
            ? phishingCounterparties
            : counterparties;
        transactionCounterparties.forEach(address => counterpartiesTarget.add(address));

        // A transfer out of the account can be spoofed (zero-value transferFrom, fake tokens), so only
        // the account being a sender of the transaction itself proves the user signed it.
        const isSignedByUser = transaction.details.vin.some(vin =>
            vin.addresses?.some(isOwnAddress),
        );
        if (!isSignedByUser) return;

        normalizeCounterparties(getTransactionPaidRecipients(transaction, isOwnAddress)).forEach(
            address => {
                // A pending payment has no block time yet, but still makes the recipient trusted.
                const blockTimes = [sentTo.get(address), transaction.blockTime].filter(
                    isNotNullOrUndefined,
                );
                sentTo.set(address, blockTimes.length > 0 ? Math.max(...blockTimes) : undefined);
            },
        );
    });

    return { sentTo, counterparties, phishingCounterparties };
};

type RecipientParams = {
    address: string;
    history: RecipientHistory;
    networkType: NetworkType;
};

// Receiving funds from an address proves nothing, since a poisoner can send to anyone.
export const isNewRecipient = ({ address, history, networkType }: RecipientParams) =>
    !history.sentTo.has(normalizeAddress(address, networkType));

export const getRecipientLastSentTime = ({ address, history, networkType }: RecipientParams) =>
    history.sentTo.get(normalizeAddress(address, networkType));

export const isPossiblePoisoning = ({ address, history, networkType }: RecipientParams) => {
    const { sentTo, counterparties, phishingCounterparties } = history;
    const recipient = normalizeAddress(address, networkType);

    // An address the user paid before is trusted even though a poisoner may have imitated it since.
    if (sentTo.has(recipient)) return false;

    const hasLookalike = (addresses: ReadonlySet<string>) => {
        for (const counterparty of addresses) {
            if (isNormalizedLookalike(recipient, counterparty, networkType)) return true;
        }

        return false;
    };
    const isPhishingOnly = phishingCounterparties.has(recipient) && !counterparties.has(recipient);

    return hasLookalike(counterparties) || hasLookalike(phishingCounterparties) || isPhishingOnly;
};
