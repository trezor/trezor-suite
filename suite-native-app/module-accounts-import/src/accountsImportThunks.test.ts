import { PORTFOLIO_TRACKER_DEVICE_STATE } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions, blockchainInitialState } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import TrezorConnect, { type AccountInfo } from '@trezor/connect';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type ImportAccountThunkDeps,
    type ImportAccountThunkState,
    getAccountInfoThunk,
    importAccountThunk,
} from './accountsImportThunks';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    ...jest.requireActual('@trezor/connect'),
    default: {
        // The backend echoes the descriptor it was asked for.
        getAccountInfo: jest.fn(({ descriptor }: { descriptor: string }) =>
            Promise.resolve({ success: true, payload: { descriptor } }),
        ),
    },
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFiatRatesThunk: jest.fn(() => ({ type: 'mock/updateFiatRates' })),
}));

const accountInfo: AccountInfo = {
    descriptor: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    balance: '0',
    availableBalance: '0',
    empty: true,
    history: { total: -1, unconfirmed: 0 },
};

const buildState = (symbol: NetworkSymbol, accounts: Account[] = []): ImportAccountThunkState => ({
    wallet: { accounts, blockchain: blockchainInitialState },
    tokenDefinitions: {},
    networks: mockNetworksState([symbol]),
});

describe('importAccountThunk', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each([
        { symbol: 'arc', backendType: 'evm-rpc' },
        { symbol: 'eth', backendType: 'blockbook' },
    ] as const)(
        'creates an imported $symbol account on the $backendType backend',
        async ({ symbol, backendType }) => {
            const state = buildState(asNetworkSymbol(symbol));
            const getState = () => state;
            const extra = createMockDeps<ImportAccountThunkDeps>({
                services: { getTokenDefinitionsEnabledNetworks: asGetter(() => []) },
            });
            const { actions, dispatch } = createMockDispatch({ getState, extra });

            await importAccountThunk({
                accountInfo,
                accountLabel: 'Imported',
                symbol: asNetworkSymbol(symbol),
            })(dispatch, getState, extra);

            const createAction = actions.find(accountsActions.createAccount.match);

            expect(createAction?.payload.account.backendType).toBe(backendType);
        },
    );

    it('gives an already imported account the configured backend type when imported again', async () => {
        const symbol = asNetworkSymbol('arc');
        const existingAccount = mockWalletAccount({
            symbol,
            descriptor: asAccountDescriptor(accountInfo.descriptor),
            deviceState: PORTFOLIO_TRACKER_DEVICE_STATE,
            imported: true,
        });
        const state = buildState(symbol, [existingAccount]);
        const getState = () => state;
        const extra = createMockDeps<ImportAccountThunkDeps>({
            services: { getTokenDefinitionsEnabledNetworks: asGetter(() => []) },
        });
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await importAccountThunk({ accountInfo, accountLabel: 'Imported', symbol })(
            dispatch,
            getState,
            extra,
        );

        const updateAction = actions.find(accountsActions.updateAccount.match);

        expect(updateAction?.payload.account.backendType).toBe('evm-rpc');
    });
});

describe('getAccountInfoThunk', () => {
    const requestAccountInfo = async (xpubAddress: string) => {
        const symbol = asNetworkSymbol('btc');
        const getState = () => buildState(symbol);
        const extra = createMockDeps<ImportAccountThunkDeps>({
            services: { getTokenDefinitionsEnabledNetworks: asGetter(() => []) },
        });
        const { dispatch } = createMockDispatch({ getState, extra });

        await getAccountInfoThunk({
            symbol,
            baseCurrencyCode: 'usd' as BaseCurrencyCode,
            xpubAddress,
        })(dispatch, getState, extra);
    };

    it('asks for the canonical descriptor without the firmware checksum the xpub sheet copies', async () => {
        await requestAccountInfo('tr([71d98c03/86h/0h/0h]xpub6CXYp/<0;1>/*)#qmnlgwmu');

        expect(TrezorConnect.getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({
                descriptor: "tr([71d98c03/86'/0'/0']xpub6CXYp/<0;1>/*)",
            }),
        );
    });

    it('leaves a value without a checksum unchanged', async () => {
        await requestAccountInfo('zpub6rFR7y4Q2AijBE');

        expect(TrezorConnect.getAccountInfo).toHaveBeenLastCalledWith(
            expect.objectContaining({ descriptor: 'zpub6rFR7y4Q2AijBE' }),
        );
    });
});

describe('importing an already imported account', () => {
    const descriptor = "tr([71d98c03/86'/0'/0']xpub6CXYp/<0;1>/*)";
    const firmwareDescriptor = 'tr([71d98c03/86h/0h/0h]xpub6CXYp/<0;1>/*)';

    it.each([
        { stored: descriptor, scanned: `${firmwareDescriptor}#qmnlgwmu` },
        { stored: `${descriptor}#qmnlgwmu`, scanned: firmwareDescriptor },
    ])('recognises $stored when $scanned is imported', async ({ stored, scanned }) => {
        const symbol = asNetworkSymbol('btc');
        const existingAccount = mockWalletAccount({
            symbol,
            descriptor: asAccountDescriptor(stored),
            deviceState: PORTFOLIO_TRACKER_DEVICE_STATE,
            imported: true,
        });
        const state = buildState(symbol, [existingAccount]);
        const getState = () => state;
        const extra = createMockDeps<ImportAccountThunkDeps>({
            services: { getTokenDefinitionsEnabledNetworks: asGetter(() => []) },
        });
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        const { payload } = await getAccountInfoThunk({
            symbol,
            baseCurrencyCode: 'usd' as BaseCurrencyCode,
            xpubAddress: scanned,
        })(dispatch, getState, extra);
        await importAccountThunk({
            accountInfo: { ...accountInfo, ...(payload as Pick<AccountInfo, 'descriptor'>) },
            accountLabel: 'Imported',
            symbol,
        })(dispatch, getState, extra);

        expect(actions.find(accountsActions.updateAccount.match)?.payload.account.key).toBe(
            existingAccount.key,
        );
        expect(actions.find(accountsActions.createAccount.match)).toBeUndefined();
    });
});
