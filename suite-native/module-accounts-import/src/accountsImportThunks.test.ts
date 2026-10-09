import { PORTFOLIO_TRACKER_DEVICE_STATE } from '@suite-common/device';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions, blockchainInitialState } from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type AccountInfo } from '@trezor/connect';
import { asGetter, createMockDeps } from '@trezor/dependency-injection';

import {
    type ImportAccountThunkDeps,
    type ImportAccountThunkState,
    importAccountThunk,
} from './accountsImportThunks';

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
