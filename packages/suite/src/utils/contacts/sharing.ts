import { getFreshAddresses } from '@suite-common/address';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { type AccountAddress } from '@trezor/connect';

import { type ContactsWalletState, type SharedAddress } from 'src/reducers/suite/contactsReducer';

/**
 * A shared address blocks its receive slot until it is used on-chain or this window passes without
 * use. Without the window, unfunded shares would eventually exhaust the gap-limited pool of fresh
 * addresses and sharing would lock up. Reclaiming hands out the same deterministic address again,
 * so two contacts could end up with one address: an accepted privacy trade-off after a year, never
 * a risk to funds (it is always my own address).
 */
export const SHARE_RECLAIM_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

type SharingWallet = Partial<Pick<ContactsWalletState, 'sharedAddresses' | 'spentSharedAddresses'>>;

type IsSharedAddressOutstandingParams = {
    shared: SharedAddress;
    isSpent: boolean;
    now: number;
};

/**
 * Whether a shared address still blocks its receive slot: unused on-chain and within the reclaim
 * window. Once it does not, the address may be handed out again, to any contact.
 */
export const isSharedAddressOutstanding = ({
    shared,
    isSpent,
    now,
}: IsSharedAddressOutstandingParams): boolean =>
    !isSpent && now - shared.sharedAt < SHARE_RECLAIM_WINDOW_MS;

/**
 * My receive addresses currently committed to a contact. Picking the next address to share must
 * skip them, so one address is never given to two contacts.
 */
export const outstandingSharedAddresses = (wallet: SharingWallet, now: number): string[] => {
    const spent = wallet.spentSharedAddresses ?? {};

    return Object.entries(wallet.sharedAddresses ?? {})
        .filter(([address, shared]) =>
            isSharedAddressOutstanding({ shared, isSpent: spent[address] === true, now }),
        )
        .map(([address]) => address);
};

/**
 * How many of my addresses a contact currently holds. Counts the same set that blocks re-sharing,
 * so the count can never disagree with the remaining capacity.
 */
export const outstandingSharedCountForPeer = (
    wallet: SharingWallet,
    peerNpub: string,
    now: number,
): number => {
    const shared = wallet.sharedAddresses ?? {};

    return outstandingSharedAddresses(wallet, now).filter(
        address => shared[address]?.npub === peerNpub,
    ).length;
};

/**
 * What Suite's receive flow treats as given out besides on-chain use: addresses revealed or copied
 * on the Receive page, labeled unused addresses and addresses with a pending transaction.
 */
export type ReceiveFlowExclusions = {
    touchedAddresses: ReceiveInfo[];
    labeledUnusedAddresses: ReceiveInfo[];
    pendingAddresses: string[];
};

type GetShareableAddressesParams = ReceiveFlowExclusions & {
    account: Account;
    wallet: SharingWallet;
    now: number;
};

/**
 * The receive addresses of this account that can be shared with a contact. They are fresh by the
 * rules of the Receive page, so an address shown or given out there never goes to a contact, and
 * no other contact holds them. `account.addresses.unused` is the gap-limited window that recovery
 * rediscovers, so sharing beyond it could fund an address recovery would not find. An empty list
 * therefore means sharing must be blocked.
 */
export const getShareableAddresses = ({
    account,
    wallet,
    now,
    touchedAddresses,
    labeledUnusedAddresses,
    pendingAddresses,
}: GetShareableAddressesParams): AccountAddress[] => {
    // Without discovered addresses the account's only "fresh address" is its descriptor.
    if (!account.addresses) return [];

    const { used, unused } = account.addresses;
    const sharedAddresses = wallet.sharedAddresses ?? {};
    // Sharing also marks the address touched. Whether it still blocks its slot is decided by the
    // share, which is reclaimed after SHARE_RECLAIM_WINDOW_MS, so that touch is not counted here.
    const touchedOutsideShares = touchedAddresses.filter(
        ({ address }) => !Object.hasOwn(sharedAddresses, address),
    );
    const unusedWithActivity = unused.filter(
        ({ address, transfers }) => transfers > 0 || pendingAddresses.includes(address),
    );

    return getFreshAddresses(
        account,
        [...touchedOutsideShares, ...labeledUnusedAddresses, ...unusedWithActivity, ...used],
        [...pendingAddresses, ...outstandingSharedAddresses(wallet, now)],
        isUtxoBased(account),
    );
};

/** How many addresses this account can still share. 0 means sharing must be blocked. */
export const accountShareCapacity = (params: GetShareableAddressesParams): number =>
    getShareableAddresses(params).length;
