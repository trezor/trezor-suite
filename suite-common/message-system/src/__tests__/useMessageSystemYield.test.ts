import { combineReducers } from '@reduxjs/toolkit';

import {
    configureMockStore,
    extraDependenciesCommonMock,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';

import { messageSystemInitialState, prepareMessageSystemReducer } from '../messageSystemReducer';
import { type MessageSystemState } from '../messageSystemTypes';
import { useMessageSystemYield } from '../useMessageSystemYield';

const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);

const VAULT_CONTRACT_ADDRESS = '0xAbCdEf0123456789abcdef0123456789ABCDEF01';

const stateWithDisabledFeatures = {
    ...messageSystemInitialState,
    config: {
        version: 1,
        timestamp: '2023-01-01',
        sequence: 1,
        actions: [
            {
                message: {
                    id: 'depositDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    variant: 'critical',
                    content: { en: 'Deposit disabled', cs: 'Deposit vypnutý' },
                    feature: [{ domain: 'earn.yield.deposit', flag: false }],
                },
            },
            {
                message: {
                    id: 'withdrawVaultDisabledMsg',
                    priority: 1,
                    dismissible: false,
                    category: ['feature'],
                    content: { en: 'Vault withdrawal disabled' },
                    feature: [
                        {
                            domain: 'earn.yield.withdraw',
                            flag: false,
                            payload: { vaultContractAddresses: [VAULT_CONTRACT_ADDRESS] },
                        },
                    ],
                },
            },
        ],
        experiments: [],
    },
    validMessages: {
        banner: [],
        context: [],
        modal: [],
        feature: ['depositDisabledMsg', 'withdrawVaultDisabledMsg'],
    },
} as unknown as MessageSystemState;

const createStore = (state: MessageSystemState = stateWithDisabledFeatures) =>
    configureMockStore({
        extra: {},
        reducer: combineReducers({ messageSystem: messageSystemReducer }),
        preloadedState: { messageSystem: state } as { messageSystem: MessageSystemState },
    });

const renderHook = (props: Parameters<typeof useMessageSystemYield>[0]) =>
    renderHookWithStoreProvider(() => useMessageSystemYield(props), {
        store: createStore(),
    });

describe('useMessageSystemYield', () => {
    it('returns disabled state, message content and variant when the feature is disabled', () => {
        const { result } = renderHook({ type: 'deposit', locale: 'en' });

        expect(result.current).toMatchObject({
            isDisabled: true,
            content: 'Deposit disabled',
            variant: 'critical',
        });
    });

    it('returns localized message content', () => {
        const { result } = renderHook({ type: 'deposit', locale: 'cs' });

        expect(result.current.content).toBe('Deposit vypnutý');
    });

    it('applies vault-targeted feature only to the matching vault', () => {
        const { result: matchingVault } = renderHook({
            type: 'withdraw',
            vaultContractAddress: VAULT_CONTRACT_ADDRESS.toLowerCase(),
            locale: 'en',
        });
        const { result: otherVault } = renderHook({
            type: 'withdraw',
            vaultContractAddress: '0x0000000000000000000000000000000000000000',
            locale: 'en',
        });
        const { result: noVault } = renderHook({ type: 'withdraw', locale: 'en' });

        expect(matchingVault.current).toMatchObject({
            isDisabled: true,
            content: 'Vault withdrawal disabled',
        });
        expect(otherVault.current.isDisabled).toBe(false);
        expect(noVault.current.isDisabled).toBe(false);
    });

    it('returns not disabled when no feature messages are configured', () => {
        const store = createStore(messageSystemInitialState);
        const { result } = renderHookWithStoreProvider(
            () => useMessageSystemYield({ type: 'deposit', locale: 'en' }),
            { store },
        );

        expect(result.current).toMatchObject({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        });
    });
});
