import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    type CustomTokensState,
    customTokensActions,
    customTokensReducer,
    selectCustomTokenContracts,
    selectIsCustomToken,
} from './customTokensSlice';

const symbol = asNetworkSymbol('eth');
const accountKey = 'descriptor-eth-session' as AccountKey;
const otherAccountKey = 'other-eth-session' as AccountKey;
const contract = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const otherContract = '0x6b175474e89094c44da98b954eedeac495271d0f';

const reduce = (state: CustomTokensState, ...actions: { type: string }[]) =>
    actions.reduce(customTokensReducer, state);

const rootState = (customTokens: CustomTokensState) => ({ wallet: { customTokens } });

const add = (c: string) => customTokensActions.addCustomToken({ accountKey, symbol, contract: c });
const remove = (c: string) =>
    customTokensActions.removeCustomToken({ accountKey, symbol, contract: c });

describe(customTokensActions.addCustomToken.type, () => {
    it('adds a normalized contract to its account only', () => {
        const state = reduce({}, add(contract));

        expect(selectCustomTokenContracts(rootState(state), accountKey)).toEqual([
            contract.toLowerCase(),
        ]);
        expect(selectCustomTokenContracts(rootState(state), otherAccountKey)).toEqual([]);
    });

    it('does not add the same contract twice in a different casing', () => {
        const state = reduce({}, add(contract), add(contract.toLowerCase()));

        expect(selectCustomTokenContracts(rootState(state), accountKey)).toHaveLength(1);
    });
});

describe(customTokensActions.removeCustomToken.type, () => {
    it('removes a contract in a different casing and keeps the others', () => {
        const state = reduce({}, add(contract), add(otherContract), remove(contract.toLowerCase()));

        expect(selectCustomTokenContracts(rootState(state), accountKey)).toEqual([otherContract]);
    });

    it('drops the account entry once its last contract is removed', () => {
        const state = reduce({}, add(contract), remove(contract));

        expect(state).toEqual({});
    });
});

describe(selectIsCustomToken.name, () => {
    it('tells a token the user added regardless of casing', () => {
        const state = rootState(reduce({}, add(contract)));

        expect(selectIsCustomToken(state, { key: accountKey, symbol }, contract)).toBe(true);
        expect(selectIsCustomToken(state, { key: accountKey, symbol }, otherContract)).toBe(false);
        expect(selectIsCustomToken(state, { key: otherAccountKey, symbol }, contract)).toBe(false);
    });
});
