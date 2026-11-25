import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import {
    addCustomTokenThunk,
    fetchCustomTokenThunk,
    removeCustomTokenThunk,
} from './customTokenThunks';
import {
    type CustomTokensRootState,
    customTokensReducer,
    selectCustomTokenContracts,
} from './customTokensSlice';
import { mockSetAccountAddMetadata } from '../../mocks';
import { type AccountsRootState, prepareAccountsReducer } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';

const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});

const contract = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth'), tokens: [] });
const accountKey = account.key;

const usdt: TokenInfo = {
    standard: 'ERC20',
    contract,
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    balance: '1000000',
};

type State = AccountsRootState & CustomTokensRootState;

const initStore = (preloaded: { tokens?: TokenInfo[]; customTokens?: string[] } = {}) =>
    createTestCompositionRoot<void, State>({
        reducer: {
            wallet: combineReducers({
                accounts: accountsReducer,
                customTokens: customTokensReducer,
            }),
        },
        preloadedState: {
            wallet: {
                accounts: [{ ...account, tokens: preloaded.tokens ?? [] }],
                customTokens: preloaded.customTokens
                    ? { [accountKey]: preloaded.customTokens }
                    : {},
            },
        },
    }).services.store;

const mockGetAccountInfo = (result: unknown) =>
    jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue(result as any);

describe(fetchCustomTokenThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('returns the token read for the contract', async () => {
        const getAccountInfo = mockGetAccountInfo({ success: true, payload: { tokens: [usdt] } });

        const result = await initStore()
            .dispatch(fetchCustomTokenThunk({ accountKey, contract: contract.toUpperCase() }))
            .unwrap();

        expect(result).toEqual(usdt);
        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({
                descriptor: account.descriptor,
                details: 'tokenBalances',
                contractFilter: contract.toUpperCase(),
            }),
        );
    });

    it('rejects with fetch-failed when the backend fails', async () => {
        mockGetAccountInfo({ success: false, payload: { error: 'boom' } });

        const result = await initStore().dispatch(fetchCustomTokenThunk({ accountKey, contract }));

        expect(result.payload).toBe('fetch-failed');
    });

    it.each([
        ['no token at all', []],
        ['a contract that is not a token', [{ ...usdt, name: contract, symbol: '' }]],
    ])('rejects with not-a-token for %s', async (_, tokens) => {
        mockGetAccountInfo({ success: true, payload: { tokens } });

        const result = await initStore().dispatch(fetchCustomTokenThunk({ accountKey, contract }));

        expect(result.payload).toBe('not-a-token');
    });
});

describe(addCustomTokenThunk.name, () => {
    it('remembers the contract, lists the token and shows it', () => {
        const store = initStore();

        store.dispatch(addCustomTokenThunk({ accountKey, token: usdt }));

        expect(selectCustomTokenContracts(store.getState(), accountKey)).toEqual([contract]);
        expect(selectAccountByKey(store.getState(), accountKey)?.tokens).toEqual([
            expect.objectContaining({ contract, symbol: 'USDT', balance: '1' }),
        ]);
        expect(store.getActions()).toContainEqual(
            tokenDefinitionsActions.setTokenStatus({
                symbol: account.symbol,
                contractAddress: contract,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
    });

    it('shows a token the account already holds without listing it a second time', () => {
        const store = initStore({
            tokens: [mockAccountToken({ contract: contract.toUpperCase() })],
        });

        store.dispatch(addCustomTokenThunk({ accountKey, token: usdt }));

        expect(selectAccountByKey(store.getState(), accountKey)?.tokens).toHaveLength(1);
        expect(selectCustomTokenContracts(store.getState(), accountKey)).toEqual([contract]);
        expect(store.getActions()).toContainEqual(
            expect.objectContaining({
                type: tokenDefinitionsActions.setTokenStatus.type,
                payload: expect.objectContaining({ status: TokenManagementAction.SHOW }),
            }),
        );
    });
});

describe(removeCustomTokenThunk.name, () => {
    afterEach(() => jest.restoreAllMocks());

    const otherContract = '0x' + '1'.repeat(40);
    const initRemoveStore = () =>
        initStore({
            tokens: [mockAccountToken({ contract }), mockAccountToken({ contract: otherContract })],
            customTokens: [contract],
        });
    const selectContracts = (store: ReturnType<typeof initStore>) =>
        selectAccountByKey(store.getState(), accountKey)?.tokens?.map(t => t.contract);

    it('forgets and hides the contract, and drops a token the backend does not list', async () => {
        mockGetAccountInfo({ success: true, payload: { tokens: [] } });
        const store = initRemoveStore();

        await store.dispatch(
            removeCustomTokenThunk({ accountKey, contract: contract.toUpperCase() }),
        );

        expect(selectCustomTokenContracts(store.getState(), accountKey)).toEqual([]);
        expect(selectContracts(store)).toEqual([otherContract]);
        expect(store.getActions()).toContainEqual(
            tokenDefinitionsActions.setTokenStatus({
                symbol: account.symbol,
                contractAddress: contract.toUpperCase(),
                status: TokenManagementAction.HIDE,
                type: DefinitionType.COIN,
            }),
        );
    });

    it.each([
        ['the backend still lists it', { success: true, payload: { tokens: [usdt] } }],
        ['the backend cannot be read', { success: false, payload: { error: 'boom' } }],
    ])('keeps the token, hidden, when %s', async (_, response) => {
        mockGetAccountInfo(response);
        const store = initRemoveStore();

        await store.dispatch(removeCustomTokenThunk({ accountKey, contract }));

        expect(selectCustomTokenContracts(store.getState(), accountKey)).toEqual([]);
        expect(selectContracts(store)).toEqual([contract, otherContract]);
    });
});
