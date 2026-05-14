import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Bip43Path, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectDeviceAccountsByNetworkSymbol,
    selectDiscoveryForSelectedDevice,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, {
    type CoinInfo,
    type DiscoveryAccount,
    type DiscoveryAccountType,
    UI_REQUEST,
    UI_RESPONSE,
} from '@trezor/connect';

// Matches the order used by Discovery: p2wpkh → p2tr → p2sh → p2pkh
const ACCOUNT_TYPE_ORDER = [
    'p2wpkh',
    'p2tr',
    'p2sh',
    'p2pkh',
] as const satisfies readonly DiscoveryAccountType[];

const getDiscoveryAccountType = (path: Bip43Path): DiscoveryAccountType => {
    const purpose = path.split('/')[1]?.replaceAll("'", '');
    switch (purpose) {
        case '86':
        case '10025':
            return 'p2tr';
        case '84':
            return 'p2wpkh';
        case '49':
            return 'p2sh';
        default:
            return 'p2pkh';
    }
};

const getHDPath = (path: Bip43Path): number[] =>
    path
        .split('/')
        .filter(p => p !== 'm')
        .map(p => {
            const hardened = p.endsWith("'");
            const index = parseInt(p.replaceAll("'", ''), 10);

            return hardened ? index + 0x80000000 : index;
        });

const accountToDiscoveryAccount = (account: Account, coinInfo: CoinInfo): DiscoveryAccount => {
    const address_n = getHDPath(account.path);

    return {
        type: getDiscoveryAccountType(account.path),
        label: `Account #${account.index + 1}`,
        descriptor: account.descriptor,
        address_n,
        empty: account.empty,
        balance: `${account.formattedBalance} ${coinInfo.shortcut}`,
        addresses: account.addresses,
        descriptorChecksum: account.descriptorChecksum,
    };
};

const buildDiscoveryAccounts = (accounts: Account[], coinInfo: CoinInfo): DiscoveryAccount[] => {
    const result: DiscoveryAccount[] = [];

    for (const type of ACCOUNT_TYPE_ORDER) {
        const typeAccounts = accounts
            .filter(a => getDiscoveryAccountType(a.path) === type)
            .sort((a, b) => a.index - b.index);

        for (const account of typeAccounts) {
            result.push(accountToDiscoveryAccount(account, coinInfo));
            // Discovery shows accounts up to and including the first empty one per type
            if (account.empty) break;
        }
    }

    return result;
};

export const prepareConnectPopupMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState }) => {
        await next(action);

        if (action.type === UI_REQUEST.INSUFFICIENT_FUNDS) {
            dispatch(
                notificationsActions.addToast({
                    type: 'not-enough-funds-error',
                }),
            );
        }

        if (action.type === UI_REQUEST.REQUEST_DISCOVERY_ACCOUNTS) {
            const discovery = selectDiscoveryForSelectedDevice(getState());

            if (discovery?.status !== 'complete') {
                // Discovery hasn't completed — send null so Connect falls back
                // to its own on-device discovery instead of using partial data.
                TrezorConnect.uiResponse({
                    type: UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNTS,
                    payload: null,
                });

                return action;
            }

            const { coinInfo } = action.payload;
            const symbol = coinInfo.shortcut.toLowerCase() as NetworkSymbol;
            const allAccounts = selectDeviceAccountsByNetworkSymbol(getState(), symbol);
            // Exclude coinjoin accounts — they use SLIP-25 paths and unlockPath which
            // Connect's Discovery does not produce and DiscoveryAccount does not support.
            const accounts = allAccounts.filter(a => a.backendType !== 'coinjoin');
            const discoveryAccounts = buildDiscoveryAccounts(accounts, coinInfo);

            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNTS,
                payload: discoveryAccounts.length > 0 ? { accounts: discoveryAccounts } : null,
            });
        }

        return action;
    },
);
