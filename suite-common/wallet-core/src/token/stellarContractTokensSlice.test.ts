import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    type StellarContractTokensState,
    type StellarDiscoveredContractTokensState,
    prepareStellarContractTokensReducer,
    prepareStellarDiscoveredContractTokensReducer,
    selectStellarContractTokens,
    selectStellarContractTokensToRead,
    selectStellarDiscoveredContractTokens,
    stellarContractTokensActions,
    stellarDiscoveredContractTokensActions,
} from './stellarContractTokensSlice';

const stellarContractTokensReducer = prepareStellarContractTokensReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadStellarContractTokens: mockReducer() },
});

const accountKey = 'descriptor-xlm-session' as AccountKey;
const otherAccountKey = 'other-xlm-session' as AccountKey;
const contract = 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV';
const otherContract = 'CC64WBDGS6QQP22QTTIACYIXT3WF7BBQEYOQPLTP7GTKYY7PZ74QYGSL';

const stellarDiscoveredContractTokensReducer = prepareStellarDiscoveredContractTokensReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadStellarDiscoveredContractTokens: mockReducer() },
});

const reduce = (state: StellarContractTokensState, ...actions: { type: string }[]) =>
    actions.reduce(stellarContractTokensReducer, state);

const reduceDiscovered = (
    state: StellarDiscoveredContractTokensState,
    ...actions: { type: string }[]
) => actions.reduce(stellarDiscoveredContractTokensReducer, state);

const rootState = (
    stellarContractTokens: StellarContractTokensState,
    stellarDiscoveredContractTokens: StellarDiscoveredContractTokensState = {},
) => ({ wallet: { stellarContractTokens, stellarDiscoveredContractTokens } });

describe('stellarContractTokens', () => {
    it('adds a contract to the account that watches it', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
        );

        expect(selectStellarContractTokens(rootState(state), accountKey)).toEqual([contract]);
    });

    it('does not add the same contract twice', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
        );

        expect(state[accountKey]).toEqual([contract]);
    });

    it('keeps each account list separate', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
            stellarContractTokensActions.addContractToken({
                accountKey: otherAccountKey,
                contract: otherContract,
            }),
        );

        expect(state[accountKey]).toEqual([contract]);
        expect(state[otherAccountKey]).toEqual([otherContract]);
    });

    it('removes only the given contract', () => {
        const state = reduce(
            {},
            stellarContractTokensActions.addContractToken({ accountKey, contract }),
            stellarContractTokensActions.addContractToken({
                accountKey,
                contract: otherContract,
            }),
            stellarContractTokensActions.removeContractToken({ accountKey, contract }),
        );

        expect(state[accountKey]).toEqual([otherContract]);
    });

    it('reports no contracts for an account that never added one', () => {
        expect(selectStellarContractTokens(rootState({}), accountKey)).toEqual([]);
    });
});

describe('stellarDiscoveredContractTokens', () => {
    it("replaces the account's holdings with the latest sweep, rather than accumulating them", () => {
        const state = reduceDiscovered(
            {},
            stellarDiscoveredContractTokensActions.setDiscoveredContractTokens({
                accountKey,
                contracts: [contract, otherContract],
            }),
            stellarDiscoveredContractTokensActions.setDiscoveredContractTokens({
                accountKey,
                contracts: [otherContract],
            }),
        );

        expect(selectStellarDiscoveredContractTokens(rootState({}, state), accountKey)).toEqual([
            otherContract,
        ]);
    });

    it("leaves another account's holdings alone", () => {
        const state = reduceDiscovered(
            {},
            stellarDiscoveredContractTokensActions.setDiscoveredContractTokens({
                accountKey,
                contracts: [contract],
            }),
            stellarDiscoveredContractTokensActions.setDiscoveredContractTokens({
                accountKey: otherAccountKey,
                contracts: [otherContract],
            }),
        );

        expect(selectStellarDiscoveredContractTokens(rootState({}, state), accountKey)).toEqual([
            contract,
        ]);
    });
});

describe(selectStellarContractTokensToRead.name, () => {
    it('asks for what the user added and what the account turned out to hold, without repeating one', () => {
        expect(
            selectStellarContractTokensToRead(
                rootState(
                    { [accountKey]: [contract] },
                    { [accountKey]: [contract, otherContract] },
                ),
                accountKey,
            ),
        ).toEqual([contract, otherContract]);
    });

    it('asks for the hand-added contracts while nothing has been discovered yet', () => {
        expect(
            selectStellarContractTokensToRead(rootState({ [accountKey]: [contract] }), accountKey),
        ).toEqual([contract]);
    });

    it('asks for nothing when the account has neither', () => {
        expect(selectStellarContractTokensToRead(rootState({}), accountKey)).toEqual([]);
    });
});
