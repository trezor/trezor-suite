import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

export const MOCK_ACCOUNT_DEVICE_SESSION_ID: StaticSessionId = '1@2:3';

export const btc1NormalAccount = mockWalletAccount({
    symbol: 'btc',
    accountLabel: 'BTC Account #1',
    deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accountType: 'normal',
    descriptor: asAccountDescriptor('btc1-normal'),
    addresses: {
        used: [
            {
                address: 'USED1',
                path: 'path_USED1',
                balance: '10000000',
                transfers: 0,
                sent: '0',
                received: '0',
            },
            {
                address: 'USED2',
                path: 'path_USED2',
                balance: '20000000',
                transfers: 0,
                sent: '0',
                received: '0',
            },
        ],
        change: [
            {
                address: 'CHANGE1',
                path: 'path_CHANGE1',
                transfers: 0,
                sent: '0',
                received: '0',
                balance: '0',
            },
        ],
        unused: [
            {
                address: 'UNUSED1',
                path: 'path_UNUSED1',
                transfers: 0,
                sent: '0',
                received: '0',
                balance: '0',
            },
            {
                address: 'UNUSED2',
                path: 'path_UNUSED2',
                transfers: 0,
                sent: '0',
                received: '0',
                balance: '0',
            },
        ],
    },
    visible: true,
});

export const btc2legacyAccount = mockWalletAccount({
    symbol: 'btc',
    accountLabel: 'BTC Account #2',
    deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,

    accountType: 'legacy',
    descriptor: asAccountDescriptor('btc2-legacy'),
    addresses: {
        used: [],
        change: [],
        unused: [],
    },
    visible: true,
});

export const eth1NormalAccount = mockWalletAccount({
    symbol: 'eth',
    accountLabel: 'ETH Account #1',
    deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,

    accountType: 'normal',
    descriptor: asAccountDescriptor('eth1-normal'),
    visible: true,
});

export const eth2legacyAccount = mockWalletAccount({
    symbol: 'eth',
    accountLabel: 'ETH Account #2',
    deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accountType: 'legacy',
    descriptor: asAccountDescriptor('eth2-legacy'),
    visible: true,
});

export const eth3legacyAccount = mockWalletAccount({
    symbol: 'eth',
    accountLabel: 'ETH Account #3 HIDDEN',
    deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accountType: 'legacy',
    descriptor: asAccountDescriptor('eth3-legacy'),
    visible: false,
});

export const sol1normalAccount = mockWalletAccount({
    symbol: 'sol',
    accountLabel: 'SOL Account #1',
    deviceState: MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accountType: 'normal',
    descriptor: asAccountDescriptor('sol1-normal'),
    visible: true,
});

export const accounts: Account[] = [
    btc1NormalAccount,
    btc2legacyAccount,
    eth1NormalAccount,
    eth2legacyAccount,
    eth3legacyAccount,
    sol1normalAccount,
];
