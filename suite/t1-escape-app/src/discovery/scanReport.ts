import type { ScannedAccount } from './discoverAccounts';
import { ACCOUNT_TYPE_DEFINITIONS, type AccountType, formatPath } from '../bitcoin/accountType';
import { DEEP_SCAN_ADDRESS_GAP } from '../migration/accountSnapshot';

export type ScannedAccountTypeReport = {
    accountType: AccountType;
    label: string;
    /** Number of account indexes looked at, including empty ones. */
    scannedAccounts: number;
    usedAccounts: number;
    firstPath: string;
    lastPath: string;
};

export type WalletKind = 'standard' | 'passphrase-normalized' | 'passphrase-raw';

export type ScanReport = {
    coin: 'Bitcoin';
    walletKind: WalletKind;
    addressGap: number;
    accountTypes: ScannedAccountTypeReport[];
    /** Account types this firmware cannot sign for, so they were not looked at. */
    skippedAccountTypes: string[];
};

export type BuildScanReportParams = {
    accounts: readonly ScannedAccount[];
    scannedAccountTypes: readonly AccountType[];
    walletKind: WalletKind;
};

const ALL_ACCOUNT_TYPES: AccountType[] = ['p2pkh', 'p2sh', 'p2wpkh'];

/** Summarises the scope of the scan: what was searched, so that the rest can be named too. */
export const buildScanReport = ({
    accounts,
    scannedAccountTypes,
    walletKind,
}: BuildScanReportParams): ScanReport => {
    const accountTypes = scannedAccountTypes.flatMap(accountType => {
        const ofType = accounts
            .filter(({ account }) => account.accountType === accountType)
            .toSorted((left, right) => left.account.accountIndex - right.account.accountIndex);
        const first = ofType.at(0);
        const last = ofType.at(-1);
        if (!first || !last) return [];

        return [
            {
                accountType,
                label: ACCOUNT_TYPE_DEFINITIONS[accountType].label,
                scannedAccounts: ofType.length,
                usedAccounts: ofType.filter(({ isEmpty }) => !isEmpty).length,
                firstPath: formatPath(first.account.path),
                lastPath: formatPath(last.account.path),
            },
        ];
    });

    return {
        coin: 'Bitcoin',
        walletKind,
        addressGap: DEEP_SCAN_ADDRESS_GAP,
        accountTypes,
        skippedAccountTypes: [
            ...ALL_ACCOUNT_TYPES.filter(type => !scannedAccountTypes.includes(type)).map(
                type => ACCOUNT_TYPE_DEFINITIONS[type].label,
            ),
            'Taproot',
        ],
    };
};
