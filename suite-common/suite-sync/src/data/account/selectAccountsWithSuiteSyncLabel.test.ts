import { type SuiteSyncAccount, createSuiteSyncAccountId } from '@suite-common/suite-sync-storage';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId, asWalletDescriptor } from '@trezor/device-utils';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectAccountsWithSuiteSyncLabel } from './selectAccountsWithSuiteSyncLabel';

const WALLET_DESCRIPTOR = asWalletDescriptor('selectedWallet');
const DEVICE_STATIC_SESSION_ID: StaticSessionId = 'selectedWallet@deviceId:0';

const btcAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('btcdefault'),
    deviceState: DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
});

const ethAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('ethdefault'),
    deviceState: DEVICE_STATIC_SESSION_ID,
    accountType: 'normal',
    index: 0,
});

const createSuiteSyncAccount = (account: Account, label: string): SuiteSyncAccount => ({
    id: createSuiteSyncAccountId(account.descriptor, account.symbol),
    accountDescriptor: account.descriptor,
    networkSymbol: account.symbol,
    label,
});

const createSuiteSyncAccountsRecord = (accounts: SuiteSyncAccount[]) =>
    accounts.reduce<Record<SuiteSyncAccount['id'], SuiteSyncAccount>>((acc, account) => {
        acc[account.id] = account;

        return acc;
    }, {});

const createState = (suiteSyncAccounts: SuiteSyncAccount[]): SuiteSyncDataRootState => ({
    suiteSyncData: {
        wallets: {
            [WALLET_DESCRIPTOR]: {
                wallet: {
                    walletDescriptor: WALLET_DESCRIPTOR,
                    label: null,
                },
                accounts: createSuiteSyncAccountsRecord(suiteSyncAccounts),
                addresses: {},
                outputs: {},
            },
        },
    },
});

describe('selectAccountsWithSuiteSyncLabel', () => {
    it('maps the suite sync label onto each account', () => {
        const state = createState([createSuiteSyncAccount(btcAccount, 'Daily spending')]);

        const result = selectAccountsWithSuiteSyncLabel(
            state,
            [btcAccount, ethAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        expect(result).toEqual([
            { ...btcAccount, label: 'Daily spending' },
            { ...ethAccount, label: null },
        ]);
    });

    it('preserves the wrapped object reference for an account whose data and label are unchanged', () => {
        const state = createState([createSuiteSyncAccount(btcAccount, 'Daily spending')]);

        const [btcFirst, ethFirst] = selectAccountsWithSuiteSyncLabel(
            state,
            [btcAccount, ethAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        const [btcSecond, ethSecond] = selectAccountsWithSuiteSyncLabel(
            state,
            [btcAccount, ethAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        expect(btcSecond).toBe(btcFirst);
        expect(ethSecond).toBe(ethFirst);
    });

    it('returns a new wrapped object only for the account whose source object changed', () => {
        const state = createState([createSuiteSyncAccount(btcAccount, 'Daily spending')]);

        const [btcFirst, ethFirst] = selectAccountsWithSuiteSyncLabel(
            state,
            [btcAccount, ethAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        const updatedBtcAccount: Account = { ...btcAccount, availableBalance: '123' };

        const [btcSecond, ethSecond] = selectAccountsWithSuiteSyncLabel(
            state,
            [updatedBtcAccount, ethAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        expect(btcSecond).not.toBe(btcFirst);
        expect(btcSecond?.availableBalance).toBe('123');
        expect(btcSecond?.label).toBe('Daily spending');
        // The untouched account keeps its wrapped object identity.
        expect(ethSecond).toBe(ethFirst);
    });

    it('returns a new wrapped object when only the suite sync label changes', () => {
        const stateWithLabel = createState([createSuiteSyncAccount(btcAccount, 'Daily spending')]);

        const [btcFirst] = selectAccountsWithSuiteSyncLabel(
            stateWithLabel,
            [btcAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        const stateWithRenamedLabel = createState([
            createSuiteSyncAccount(btcAccount, 'Renamed label'),
        ]);

        const [btcSecond] = selectAccountsWithSuiteSyncLabel(
            stateWithRenamedLabel,
            [btcAccount],
            DEVICE_STATIC_SESSION_ID,
        );

        expect(btcSecond).not.toBe(btcFirst);
        expect(btcSecond?.label).toBe('Renamed label');
    });
});
