import { type NetworkType } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isNotNullOrUndefined } from '@trezor/utils';

const normalizeAddress = (address: string, networkType: NetworkType) =>
    networkType === 'ethereum' ? address.toLowerCase() : address;

export type RecipientHistory = {
    // Recipients the user signed a payment to, mapped to the block time of the latest confirmed one.
    sentTo: ReadonlyMap<string, number | undefined>;
};

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
};

export const getRecipientHistory = ({
    transactions,
    descriptor,
    networkType,
}: GetRecipientHistoryParams): RecipientHistory => {
    const ownAddress = normalizeAddress(descriptor, networkType);
    const isOwnAddress = (address: string) => normalizeAddress(address, networkType) === ownAddress;
    const sentTo = new Map<string, number | undefined>();

    transactions.forEach(transaction => {
        // A transfer out of the account can be spoofed (zero-value transferFrom, fake tokens), so only
        // the account being a sender of the transaction itself proves the user signed it.
        const isSignedByUser = transaction.details.vin.some(vin =>
            vin.addresses?.some(isOwnAddress),
        );
        if (!isSignedByUser) return;

        getTransactionPaidRecipients(transaction, isOwnAddress)
            .filter(isNotNullOrUndefined)
            .map(address => normalizeAddress(address, networkType))
            .filter(address => address !== ownAddress)
            .forEach(address => {
                // A pending payment has no block time yet, but still makes the recipient trusted.
                const blockTimes = [sentTo.get(address), transaction.blockTime].filter(
                    isNotNullOrUndefined,
                );
                sentTo.set(address, blockTimes.length > 0 ? Math.max(...blockTimes) : undefined);
            });
    });

    return { sentTo };
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
