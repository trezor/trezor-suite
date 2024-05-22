import { G } from '@mobily/ts-belt';
import * as semver from 'semver';
import BigNumber from 'bignumber.js';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { getFiatRateKey, toFiatCurrency } from '@suite-common/wallet-utils';
import { DeviceModelInternal, VersionArray } from '@trezor/connect';

export const minimalSupportedFirmwareVersion = {
    T1B1: [1, 12, 1] as VersionArray,
    T2T1: [2, 6, 3] as VersionArray,
    T2B1: [2, 6, 3] as VersionArray,
    T3T1: [2, 7, 1] as VersionArray,
} as const satisfies Record<DeviceModelInternal, VersionArray>;

export const isFirmwareVersionSupported = (
    version: VersionArray | null,
    model: DeviceModelInternal | null,
) => {
    if (G.isNullable(version) || G.isNullable(model)) return true;

    const minimalVersion = minimalSupportedFirmwareVersion[model];

    if (!minimalVersion) return true;

    const versionString = version.join('.');
    const minimalVersionString = minimalVersion.join('.');

    return semver.satisfies(versionString, `>=${minimalVersionString}`);
};

// TODO: once we start including token balance in the account balance, we should use
// getAccountFiatBalance from wallet-utils and DELETE this function

// only counts native coin balance
export const getAccountFiatBalanceNative = (
    account: Account,
    localCurrency: string,
    rates?: RatesByKey,
) => {
    const coinFiatRateKey = getFiatRateKey(
        account.symbol as NetworkSymbol,
        localCurrency as FiatCurrencyCode,
    );
    const coinFiatRate = rates?.[coinFiatRateKey];
    if (!coinFiatRate?.rate) return null;

    let totalBalance = new BigNumber(0);

    // account fiat balance
    const accountBalance = toFiatCurrency(account.formattedBalance, coinFiatRate.rate, 2);

    totalBalance = totalBalance.plus(accountBalance ?? 0);

    return totalBalance.toFixed();
};

// TODO: once we start including token balance in the account balance, we should use
// getTotalFiatBalance from wallet-utils and DELETE this function

// only counts native coin balance
// balance of all accounts in the device without tokens
export const getTotalFiatBalanceNative = (
    deviceAccounts: Account[],
    localCurrency: string,
    rates?: RatesByKey,
) => {
    let instanceBalance = new BigNumber(0);
    deviceAccounts.forEach(a => {
        const accountFiatBalance = getAccountFiatBalanceNative(a, localCurrency, rates) ?? '0';
        instanceBalance = instanceBalance.plus(accountFiatBalance);
    });

    return instanceBalance;
};
