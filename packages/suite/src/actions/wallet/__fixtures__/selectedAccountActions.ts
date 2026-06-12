import { routerLocationChange } from '@suite/router';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';
const DEVICE_PATH = '1';

const device = {
    path: DEVICE_PATH,
    state: { staticSessionId: DEVICE_STATE },
};

const walletParams = {
    symbol: 'btc',
    accountIndex: 0,
    accountType: 'normal',
};

const btcAccount = mockWalletAccount({
    symbol: 'btc',
    visible: false,
    deviceState: DEVICE_STATE,
});

const btcFailedAccount = {
    ...mockWalletAccount({ symbol: 'btc', deviceState: DEVICE_STATE }),
    failed: true,
    error: 'discovery error',
};

export default [
    {
        description: 'Action ignored',
        initialState: {},
        action: {
            location: '/foo',
        },
        result: {
            status: 'none',
        },
    },
    {
        description: 'Discovery failed, requested account exists in wallet.accounts',
        initialState: {
            device: { selectedDevice: device },
            router: { app: 'wallet', params: walletParams },
            wallet: {
                accounts: [btcAccount],
                settings: { enabledNetworks: ['btc'] },
                discovery: { [DEVICE_PATH]: { status: 'failed' } },
            },
        },
        action: {
            type: routerLocationChange.type,
        },
        result: {
            status: 'exception',
            loader: 'discovery-error',
            account: { key: btcAccount.key },
            network: { symbol: 'btc' },
            params: walletParams,
        },
    },
    {
        description: 'Discovery failed for the requested account, failed account is included',
        initialState: {
            device: { selectedDevice: device },
            router: { app: 'wallet', params: walletParams },
            wallet: {
                accounts: [btcFailedAccount],
                settings: { enabledNetworks: ['btc'] },
                discovery: { [DEVICE_PATH]: { status: 'failed' } },
            },
        },
        action: {
            type: routerLocationChange.type,
        },
        result: {
            status: 'exception',
            loader: 'account-not-loaded',
            account: { key: btcFailedAccount.key },
            network: { symbol: 'btc' },
            params: walletParams,
        },
    },
    {
        description: 'Discovery failed, requested account does not exist',
        initialState: {
            device: { selectedDevice: device },
            router: { app: 'wallet', params: walletParams },
            wallet: {
                accounts: [
                    mockWalletAccount({
                        symbol: 'ltc',
                        deviceState: DEVICE_STATE,
                    }),
                ],
                settings: { enabledNetworks: ['btc', 'ltc'] },
                discovery: { [DEVICE_PATH]: { status: 'failed' } },
            },
        },
        action: {
            type: routerLocationChange.type,
        },
        result: {
            status: 'exception',
            loader: 'discovery-error',
            account: undefined,
            network: { symbol: 'btc' },
            params: walletParams,
        },
    },
] as const;
